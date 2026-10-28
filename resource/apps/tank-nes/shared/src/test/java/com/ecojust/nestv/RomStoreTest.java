package com.ecojust.nestv;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28,manifest=Config.NONE)
public class RomStoreTest {
    @Rule public TemporaryFolder temporary=new TemporaryFolder();
    static byte[] nrom(){byte[] data=new byte[16+16384+8192];data[0]='N';data[1]='E';data[2]='S';data[3]=0x1a;data[4]=1;data[5]=1;return data;}
    private void rejects(byte[] data,String name) throws Exception {try{RomStore.validate(name,data);fail("Unexpected accepted cartridge");}catch(IOException expected){assertFalse(expected.getMessage().isEmpty());}}

    @Test public void validCartridgePersistsAcrossFreshStoreAndInvalidReplacementPreservesIt() throws Exception {
        File directory=temporary.newFolder();RomStore store=new RomStore(directory);assertNull(store.info());
        byte[] bytes=nrom();RomStore.Info saved=store.replace("my-game.nes",bytes);
        assertEquals(0,saved.mapper);assertEquals(bytes.length,saved.size);assertEquals(64,saved.revision.length());
        RomStore reopened=new RomStore(directory);assertEquals(saved.revision,reopened.info().revision);
        try(java.io.InputStream input=reopened.open()){assertArrayEquals(bytes,input.readAllBytes());}
        try{store.replace("wrong.nes",new byte[100]);fail();}catch(IOException expected){}
        assertEquals(saved.revision,store.info().revision);
        assertEquals(saved.revision,new RomStore(directory).info().revision);
    }
    @Test public void validatesMagicLengthExtensionConsoleTimingAndMapper() throws Exception {
        rejects(nrom(),"game.zip");rejects(new byte[16],"game.nes");rejects(Arrays.copyOf(nrom(),100),"game.nes");
        rejects(Arrays.copyOf(nrom(),nrom().length+1),"game.nes");
        byte[] data=nrom();data[7]=1;rejects(data,"game.nes");
        data=nrom();data[9]=1;rejects(data,"game.nes");
        data=nrom();data[10]=68;rejects(data,"game.nes");
        data=nrom();data[6]=96;rejects(data,"game.nes");
        data=nrom();data[6]=32;assertEquals(2,RomStore.validate("jackal.nes",data).mapper);
    }
    @Test public void nesTwoRejectsUnsupportedSubmappersHardwareAndLengths() throws Exception {
        byte[] data=nrom();data[7]=8;assertEquals(0,RomStore.validate("test.nes",data).mapper);
        data[8]=16;rejects(data,"test.nes");data[8]=0;
        data[9]=15;rejects(data,"test.nes");data[9]=0;
        data[12]=3;rejects(data,"test.nes");data[12]=2;RomStore.validate("test.nes",data);
        data[14]=1;rejects(data,"test.nes");data[14]=0;data[15]=2;rejects(data,"test.nes");
    }
}
