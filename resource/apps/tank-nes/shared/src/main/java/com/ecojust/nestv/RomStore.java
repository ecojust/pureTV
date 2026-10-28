package com.ecojust.nestv;

import android.util.AtomicFile;
import org.json.JSONObject;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/** A single validated cartridge in private app storage; never executes or extracts an uploaded file. */
public final class RomStore {
    public static final int MAX_BYTES = 16 * 1024 * 1024;
    private static final int MAGIC = 0x4e455331;
    private static final Set<Integer> MAPPERS = new HashSet<>(Arrays.asList(0,1,2,3,4,5,7,9,11,34,38,66,71,79,94,118,119,140,180,240,241));
    private final AtomicFile file;
    private volatile Info current;

    public static final class Info {
        public final String name, revision;
        public final int size, mapper;
        Info(String name, int size, int mapper, String revision) { this.name=name;this.size=size;this.mapper=mapper;this.revision=revision; }
        public JSONObject json() {
            JSONObject value=new JSONObject();
            try { value.put("name",name).put("size",size).put("mapper",mapper).put("revision",revision).put("url","/rom.nes"); }
            catch (Exception impossible) { throw new IllegalStateException(impossible); }
            return value;
        }
    }

    public RomStore(File directory) {
        file=new AtomicFile(new File(directory,"cartridge.bin"));
        try (DataInputStream input=new DataInputStream(file.openRead())) {
            if (input.readInt()!=MAGIC) throw new IOException("Bad saved cartridge");
            String name=input.readUTF();int length=input.readInt();
            if (length<16 || length>MAX_BYTES) throw new IOException("Bad saved length");
            byte[] data=new byte[length];input.readFully(data);
            if (input.read()!=-1) throw new IOException("Unexpected saved data");
            current=validate(name,data);
        } catch (IOException | IllegalArgumentException ignored) { current=null; }
    }

    public Info info() { return current; }
    public synchronized Info replace(String name, byte[] data) throws IOException {
        Info candidate=validate(name,data);
        FileOutputStream stream=null;
        try {
            stream=file.startWrite();
            DataOutputStream out=new DataOutputStream(stream);
            out.writeInt(MAGIC);out.writeUTF(candidate.name);out.writeInt(data.length);out.write(data);out.flush();
            file.finishWrite(stream);stream=null;current=candidate;
            return candidate;
        } finally { if(stream!=null) file.failWrite(stream); }
    }

    public synchronized InputStream open() throws IOException {
        if(current==null) throw new FileNotFoundException("No ROM imported");
        DataInputStream input=new DataInputStream(file.openRead());
        try { if(input.readInt()!=MAGIC) throw new IOException("Bad saved cartridge");input.readUTF();input.readInt();return input; }
        catch(IOException failure){input.close();throw failure;}
    }

    public static Info validate(String name, byte[] data) throws IOException {
        if(name==null || !name.toLowerCase(java.util.Locale.ROOT).endsWith(".nes")) throw new IOException("Choose a .nes cartridge file");
        name=new File(name.replace('\\','/')).getName();
        if(name.length()>160 || name.isEmpty() || name.chars().anyMatch(c -> c<32 || c==127)) throw new IOException("Invalid cartridge filename");
        if(data==null || data.length<16 || data.length>MAX_BYTES) throw new IOException("Cartridge must be 16 bytes to 16 MiB");
        if(data[0]!='N' || data[1]!='E' || data[2]!='S' || data[3]!=0x1a) throw new IOException("Not an iNES cartridge");
        int f6=data[6]&255,f7=data[7]&255;
        boolean nes2=(f7&12)==8;
        if((f6&4)!=0) throw new IOException("Trainer cartridges are unsupported");
        if((f7&3)!=0 || (!nes2 && (f7&12)!=0)) throw new IOException("Unsupported console format");
        int mapper=(f6>>4)|(f7&240),prg=data[4]&255,chr=data[5]&255;
        if(nes2){
            if((data[8]&240)!=0) throw new IOException("NES 2.0 submappers are unsupported");
            mapper|=(data[8]&15)<<8;
            int sizes=data[9]&255;
            if((sizes&15)==15 || (sizes>>4)==15) throw new IOException("NES 2.0 exponent sizes are unsupported");
            prg|=(sizes&15)<<8;chr|=(sizes>>4)<<8;
            int timing=data[12]&3;
            if(timing==1 || timing==3) throw new IOException("Use an NTSC or multi-region cartridge");
            if((data[13]&255)!=0 || (data[14]&255)!=0 || (data[15]&255)>1) throw new IOException("Unsupported expansion hardware");
        } else {
            if((data[9]&1)!=0) throw new IOException("PAL cartridges are unsupported");
            for(int i=10;i<16;i++) if(data[i]!=0) throw new IOException("Invalid iNES reserved header bytes");
        }
        if(!MAPPERS.contains(mapper)) throw new IOException("Unsupported NES mapper: "+mapper);
        long expected=16L+prg*16384L+chr*8192L+((f6&4)!=0?512:0);
        if(prg==0 || expected!=data.length) throw new IOException("Cartridge size does not match its header");
        try {
            byte[] hash=MessageDigest.getInstance("SHA-256").digest(data);StringBuilder hex=new StringBuilder();
            for(byte b:hash)hex.append(String.format(java.util.Locale.ROOT,"%02x",b&255));
            return new Info(name,data.length,mapper,hex.toString());
        } catch(java.security.NoSuchAlgorithmException impossible){throw new IllegalStateException(impossible);}
    }
}
