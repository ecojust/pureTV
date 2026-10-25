package com.ecojust.hifinitv;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;
import java.security.GeneralSecurityException;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28)
public class CredentialStoreTest {
    private SharedPreferences preferences;
    private SecretKey key;
    private CredentialStore store;
    private final CredentialStore.Credentials account = new CredentialStore.Credentials("fixture-user@example.invalid", "fixture-password-only");
    @Before public void prepare() throws Exception {
        preferences = RuntimeEnvironment.getApplication().getSharedPreferences("credential-test", Context.MODE_PRIVATE);
        preferences.edit().clear().commit(); key = KeyGenerator.getInstance("AES").generateKey();
        store = new CredentialStore(preferences, () -> key);
    }
    @Test public void bothFieldsRoundTripOnlyThroughAuthenticatedCiphertext() throws Exception {
        assertNull(store.load()); store.save(account);
        assertEquals(1, preferences.getAll().size());
        String first = preferences.getString(CredentialStore.RECORD, "");
        assertFalse(first.contains(account.username)); assertFalse(first.contains(account.password));
        String encrypted = new String(Base64.decode(first.split("\\.")[2], Base64.NO_WRAP), java.nio.charset.StandardCharsets.UTF_8);
        assertFalse(encrypted.contains(account.username)); assertFalse(encrypted.contains(account.password));
        CredentialStore reopened = new CredentialStore(preferences, () -> key);
        assertEquals(account.username, reopened.load().username); assertEquals(account.password, reopened.load().password);
        store.save(account); assertNotEquals(first, preferences.getString(CredentialStore.RECORD, ""));
    }
    @Test public void tamperedCiphertextAndChangedKeyNeverProduceAnAccount() throws Exception {
        store.save(account); String original = preferences.getString(CredentialStore.RECORD, "");
        String[] parts = original.split("\\."); byte[] encrypted = Base64.decode(parts[2], Base64.NO_WRAP); encrypted[4] ^= 1;
        preferences.edit().putString(CredentialStore.RECORD, parts[0] + "." + parts[1] + "." + Base64.encodeToString(encrypted, Base64.NO_WRAP)).commit();
        try { store.load(); fail(); } catch (GeneralSecurityException expected) { }
        preferences.edit().putString(CredentialStore.RECORD, original).commit();
        key = KeyGenerator.getInstance("AES").generateKey();
        try { store.load(); fail(); } catch (GeneralSecurityException expected) { }
        assertEquals(original, preferences.getString(CredentialStore.RECORD, ""));
    }
    @Test public void unavailableKeystoreNeverFallsBackToPlainPreferences() throws Exception {
        CredentialStore broken = new CredentialStore(preferences, () -> { throw new GeneralSecurityException("fixture unavailable key"); });
        try { broken.save(account); fail(); } catch (GeneralSecurityException expected) { }
        assertTrue(preferences.getAll().isEmpty());
    }
    @Test public void explicitReplacementRecoversPermanentlyInvalidatedKey() throws Exception {
        int[] resets = {0};
        CredentialStore recovering = new CredentialStore(preferences, new CredentialStore.KeySource() {
            public SecretKey get() throws GeneralSecurityException {
                if (resets[0] == 0) throw new android.security.keystore.KeyPermanentlyInvalidatedException();
                return key;
            }
            public void replaceInvalidKey() { resets[0]++; }
        });
        recovering.save(account); assertEquals(1, resets[0]); assertEquals(account.password, recovering.load().password);
    }
    @Test public void malformedStorageFailsClosedAndForgetRemovesTheRecord() throws Exception {
        preferences.edit().putString(CredentialStore.RECORD, "not-an-encrypted-record").commit();
        try { store.load(); fail(); } catch (GeneralSecurityException expected) { }
        store.forget(); assertTrue(preferences.getAll().isEmpty()); assertNull(store.load());
    }
}
