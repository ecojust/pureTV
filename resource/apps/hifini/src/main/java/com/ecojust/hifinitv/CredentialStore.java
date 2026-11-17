package com.ecojust.hifinitv;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONException;
import org.json.JSONObject;

/** Local, opt-in credentials. The username and password share one authenticated encrypted record. */
final class CredentialStore {
    static final String PREFERENCES = "hifini_credentials", RECORD = "sealed";
    private static final String KEY_ALIAS = "hifinitv.credentials.v1";
    private static final byte[] AAD = "com.ecojust.hifinitv.credentials.v1".getBytes(StandardCharsets.UTF_8);
    private final SharedPreferences preferences;
    private final KeySource keys;

    interface KeySource {
        SecretKey get() throws GeneralSecurityException, IOException;
        default void replaceInvalidKey() throws GeneralSecurityException, IOException { throw new GeneralSecurityException("Key cannot be replaced"); }
    }
    static final class Credentials {
        final String username, password;
        Credentials(String username, String password) { this.username = username; this.password = password; }
        boolean valid() { return username != null && !username.trim().isEmpty() && username.length() <= 256
                && password != null && !password.isEmpty() && password.length() <= 4096; }
    }

    CredentialStore(Context context) {
        this(context.getApplicationContext().getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE), new KeySource() {
            public SecretKey get() throws GeneralSecurityException, IOException { return deviceKey(); }
            public void replaceInvalidKey() throws GeneralSecurityException, IOException {
                KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null); store.deleteEntry(KEY_ALIAS);
            }
        });
    }
    CredentialStore(SharedPreferences preferences, KeySource keys) { this.preferences = preferences; this.keys = keys; }

    void save(Credentials credentials) throws GeneralSecurityException, IOException {
        if (credentials == null || !credentials.valid()) throw new IllegalArgumentException("Invalid credentials");
        byte[] plain = null;
        try {
            plain = new JSONObject().put("username", credentials.username).put("password", credentials.password)
                    .toString().getBytes(StandardCharsets.UTF_8);
            Cipher cipher;
            try { cipher = encryptionCipher(); }
            catch (android.security.keystore.KeyPermanentlyInvalidatedException | java.security.UnrecoverableKeyException invalidKey) {
                // Recovery is permitted only after the user explicitly supplies a replacement account.
                keys.replaceInvalidKey(); cipher = encryptionCipher();
            }
            cipher.updateAAD(AAD);
            byte[] encrypted = cipher.doFinal(plain);
            String record = "1." + Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP) + "."
                    + Base64.encodeToString(encrypted, Base64.NO_WRAP);
            if (!preferences.edit().putString(RECORD, record).commit()) throw new IOException("Could not save encrypted credentials");
        } catch (JSONException impossible) { throw new GeneralSecurityException("Could not encode credentials", impossible); }
        finally { if (plain != null) Arrays.fill(plain, (byte)0); }
    }

    Credentials load() throws GeneralSecurityException, IOException {
        String record = preferences.getString(RECORD, null);
        if (record == null) return null;
        byte[] plain = null;
        try {
            if (record.length() > 65536) throw new GeneralSecurityException("Invalid encrypted record");
            String[] parts = record.split("\\.", -1);
            if (parts.length != 3 || !"1".equals(parts[0])) throw new GeneralSecurityException("Invalid encrypted record");
            byte[] iv = Base64.decode(parts[1], Base64.NO_WRAP);
            if (iv.length != 12) throw new GeneralSecurityException("Invalid encrypted record");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, keys.get(), new GCMParameterSpec(128, iv)); cipher.updateAAD(AAD);
            plain = cipher.doFinal(Base64.decode(parts[2], Base64.NO_WRAP));
            JSONObject object = new JSONObject(new String(plain, StandardCharsets.UTF_8));
            Credentials result = new Credentials(object.getString("username"), object.getString("password"));
            if (!result.valid()) throw new GeneralSecurityException("Invalid encrypted record");
            return result;
        } catch (JSONException | IllegalArgumentException corrupt) { throw new GeneralSecurityException("Invalid encrypted record", corrupt); }
        finally { if (plain != null) Arrays.fill(plain, (byte)0); }
    }

    void forget() throws IOException {
        if (!preferences.edit().remove(RECORD).commit()) throw new IOException("Could not forget credentials");
    }

    private Cipher encryptionCipher() throws GeneralSecurityException, IOException {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, keys.get()); return cipher;
    }

    private static synchronized SecretKey deviceKey() throws GeneralSecurityException, IOException {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null);
        if (store.containsAlias(KEY_ALIAS)) return (SecretKey)store.getKey(KEY_ALIAS, null);
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256).setRandomizedEncryptionRequired(true).build());
        return generator.generateKey();
    }
}
