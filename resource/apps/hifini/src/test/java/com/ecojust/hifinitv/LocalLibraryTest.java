package com.ecojust.hifinitv;

import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.charset.StandardCharsets;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28)
public class LocalLibraryTest {
    private File root,files,cache,directory,index;
    @Before public void setup()throws Exception {
        root=Files.createTempDirectory("hifini-library-test").toFile();files=new File(root,"files");cache=new File(root,"cache");
        assertTrue(files.mkdirs());assertTrue(cache.mkdirs());directory=new File(files,"hifini-library");index=new File(directory,"index.json");
    }
    @After public void cleanup()throws Exception {
        try(java.util.stream.Stream<java.nio.file.Path> paths=Files.walk(root.toPath())){paths.sorted(java.util.Comparator.reverseOrder()).forEach(path->path.toFile().delete());}
    }
    private static String read(File file)throws IOException {return new String(Files.readAllBytes(file.toPath()),StandardCharsets.UTF_8);}
    private static void write(File file,String text)throws IOException {Files.write(file.toPath(),text.getBytes(StandardCharsets.UTF_8));}
    private Track track(int number){return Track.catalog("netease",String.valueOf(number+1),number%2==0?String.valueOf(number+100):"","Song "+number,"Artist "+number,"https://covers.example.invalid/"+number+".png",180+number);}
    private File temporary()throws IOException {File temporary=File.createTempFile("download-",".audio",cache);Files.write(temporary.toPath(),new byte[]{82,73,70,70,4,0,0,0,87,65,86,69});return temporary;}
    private File add(LocalLibrary library,int number)throws IOException {Track track=track(number);library.prepareDownload(track);return library.save(track,temporary());}
    private void fill(LocalLibrary library)throws IOException {for(int i=0;i<50;i++)add(library,i);}
    private static List<String> ids(LocalLibrary library){List<String> ids=new ArrayList<>();for(Track track:library.tracks())ids.add(track.id);return ids;}
    private static File tomb(File audio){return new File(audio.getParentFile(),".evict-"+audio.getName());}
    private static void fails(Work work)throws Exception {try{work.run();fail("Expected IOException");}catch(IOException expected){}}
    interface Work{void run()throws Exception;}

    @Test public void metadataAudioAndFirstDownloadOrderSurviveRecreation()throws Exception {
        LocalLibrary library=new LocalLibrary(files);File first=add(library,0),second=add(library,1);long revision=library.revision();
        LocalLibrary restored=new LocalLibrary(files);assertEquals(List.of(track(0).id,track(1).id),ids(restored));assertEquals(revision,restored.revision());
        assertEquals(first,restored.find(track(0).id));assertEquals(second,restored.find(track(1).id));
        Track actual=restored.tracks().get(0),expected=track(0);assertEquals(expected.title,actual.title);assertEquals(expected.artist,actual.artist);assertEquals(expected.cover,actual.cover);
        assertEquals(expected.source,actual.source);assertEquals(expected.sourceId,actual.sourceId);assertEquals(expected.threadId,actual.threadId);assertEquals(expected.duration,actual.duration);
        assertTrue(first.getName().matches("[0-9a-f]{64}\\.audio"));assertFalse(first.getName().contains(expected.id));
        String json=read(index);assertFalse(json.contains("musicparse-play"));assertFalse(json.contains("audioUrl"));assertFalse(json.contains("token="));
        restored.tracks().clear();assertEquals(2,restored.tracks().size());
    }
    @Test public void fiftyFirstSongEvictsOldestBeforeDownloadAndCancellationLeavesFortyNine()throws Exception {
        LocalLibrary library=new LocalLibrary(files);fill(library);File oldest=library.find(track(0).id);long revision=library.revision();
        library.prepareDownload(track(50));assertFalse(oldest.exists());assertEquals(49,library.tracks().size());assertNull(library.find(track(0).id));
        assertEquals(revision+1,library.revision());LocalLibrary restarted=new LocalLibrary(files);assertEquals(49,restarted.tracks().size());assertEquals(track(1).id,restarted.tracks().get(0).id);
        File completed=restarted.save(track(50),temporary());assertTrue(completed.exists());assertEquals(50,restarted.tracks().size());assertEquals(track(50).id,restarted.tracks().get(49).id);
    }
    @Test public void replayAndDuplicateDownloadsNeverRefreshFifoOrRevision()throws Exception {
        LocalLibrary library=new LocalLibrary(files);fill(library);List<String> original=ids(library);long revision=library.revision();File originalFile=library.find(track(0).id);
        library.prepareDownload(track(0));assertEquals(originalFile,library.find(track(0).id));File duplicate=temporary();assertEquals(originalFile,library.save(track(0),duplicate));
        assertFalse(duplicate.exists());assertEquals(original,ids(library));assertEquals(revision,library.revision());assertEquals(50,library.tracks().size());
        library.prepareDownload(track(50));assertNull(library.find(track(0).id));assertEquals(track(1).id,library.tracks().get(0).id);
    }
    @Test public void failedSaveRollsBackTheNewFileAndPreservesCommittedIndex()throws Exception {
        AtomicBoolean reject=new AtomicBoolean();LocalLibrary library=new LocalLibrary(files,()->{if(reject.get())throw new IOException("fixture commit failure");});
        File first=add(library,0);byte[] original=Files.readAllBytes(index.toPath());long revision=library.revision();reject.set(true);
        fails(()->library.save(track(1),temporary()));assertTrue(first.exists());assertEquals(List.of(track(0).id),ids(library));assertEquals(revision,library.revision());
        assertArrayEquals(original,Files.readAllBytes(index.toPath()));assertEquals(1,Arrays.stream(directory.listFiles()).filter(file->file.getName().matches("[0-9a-f]{64}\\.audio")).count());
        assertEquals(List.of(track(0).id),ids(new LocalLibrary(files)));
    }
    @Test public void failedEvictionRestoresAllAudioAndKeepsOldIndex()throws Exception {
        AtomicBoolean reject=new AtomicBoolean();LocalLibrary library=new LocalLibrary(files,()->{if(reject.get())throw new IOException("fixture commit failure");});fill(library);
        File first=library.find(track(0).id);byte[] original=Files.readAllBytes(index.toPath());long revision=library.revision();reject.set(true);
        fails(()->library.prepareDownload(track(50)));assertTrue(first.exists());assertEquals(50,library.tracks().size());assertEquals(revision,library.revision());assertArrayEquals(original,Files.readAllBytes(index.toPath()));
        assertFalse(tomb(first).exists());assertEquals(50,new LocalLibrary(files).tracks().size());
    }
    @Test public void batchDeletionIsAtomicKeepsSurvivorOrderAndIgnoresUnrelatedIds()throws Exception {
        LocalLibrary library=new LocalLibrary(files);List<File> audio=new ArrayList<>();for(int i=0;i<5;i++)audio.add(add(library,i));
        File unrelated=new File(files,"unrelated.audio");Files.write(unrelated.toPath(),new byte[]{1});long revision=library.revision();
        library.removeAll(List.of(track(1).id,track(3).id,track(1).id,"../unrelated.audio","unknown"));
        assertEquals(List.of(track(0).id,track(2).id,track(4).id),ids(library));assertEquals(revision+1,library.revision());assertFalse(audio.get(1).exists());assertFalse(audio.get(3).exists());
        assertTrue(audio.get(0).exists());assertTrue(unrelated.exists());assertEquals(ids(library),ids(new LocalLibrary(files)));
        library.removeAll(List.of("../unrelated.audio","unknown"));assertEquals(revision+1,library.revision());assertTrue(unrelated.exists());
    }
    @Test public void batchCommitFailureRestoresEverySelectedFile()throws Exception {
        AtomicBoolean reject=new AtomicBoolean();LocalLibrary library=new LocalLibrary(files,()->{if(reject.get())throw new IOException("fixture commit failure");});
        List<File> audio=new ArrayList<>();for(int i=0;i<4;i++)audio.add(add(library,i));List<String> before=ids(library);byte[] original=Files.readAllBytes(index.toPath());reject.set(true);
        fails(()->library.removeAll(List.of(track(0).id,track(2).id,track(3).id)));assertEquals(before,ids(library));assertArrayEquals(original,Files.readAllBytes(index.toPath()));
        for(File file:audio){assertTrue(file.exists());assertFalse(tomb(file).exists());}assertEquals(before,ids(new LocalLibrary(files)));
    }
    @Test public void startupRestoresEvictionMovedBeforeItsIndexWasCommitted()throws Exception {
        LocalLibrary library=new LocalLibrary(files);File first=add(library,0),second=add(library,1);add(library,2);long revision=library.revision();
        Files.move(first.toPath(),tomb(first).toPath(),StandardCopyOption.ATOMIC_MOVE);Files.move(second.toPath(),tomb(second).toPath(),StandardCopyOption.ATOMIC_MOVE);
        LocalLibrary repaired=new LocalLibrary(files);assertEquals(List.of(track(0).id,track(1).id,track(2).id),ids(repaired));assertEquals(revision,repaired.revision());
        assertTrue(first.exists());assertTrue(second.exists());assertFalse(tomb(first).exists());assertFalse(tomb(second).exists());
    }
    @Test public void startupCleansEvictionLeftAfterAnAlreadyCommittedDelete()throws Exception {
        LocalLibrary library=new LocalLibrary(files);File first=add(library,0);add(library,1);byte[] bytes=Files.readAllBytes(first.toPath());library.removeAll(List.of(track(0).id));
        Files.write(tomb(first).toPath(),bytes);LocalLibrary repaired=new LocalLibrary(files);assertEquals(List.of(track(1).id),ids(repaired));assertFalse(first.exists());assertFalse(tomb(first).exists());
    }
    @Test public void missingAudioIsPrunedAndOnlyOwnedOrphansAreCleaned()throws Exception {
        LocalLibrary library=new LocalLibrary(files);File first=add(library,0);add(library,1);long revision=library.revision();assertTrue(first.delete());
        File orphan=new File(directory,"f".repeat(64)+".audio"),unrelated=new File(directory,"notes.audio");Files.write(orphan.toPath(),new byte[]{1});Files.write(unrelated.toPath(),new byte[]{2});
        LocalLibrary repaired=new LocalLibrary(files);assertEquals(List.of(track(1).id),ids(repaired));assertEquals(revision+1,repaired.revision());assertFalse(orphan.exists());assertTrue(unrelated.exists());
        File remaining=repaired.find(track(1).id);Files.write(remaining.toPath(),new byte[]{1});assertNull(repaired.find(track(1).id));assertTrue(new LocalLibrary(files).tracks().isEmpty());
    }
    @Test public void damagedIndexPreservesAllAudioInsteadOfResettingTheLibrary()throws Exception {
        LocalLibrary library=new LocalLibrary(files);File saved=add(library,0);byte[] original=Files.readAllBytes(saved.toPath());
        for(String broken:List.of("{incomplete","{\"version\":99,\"revision\":0,\"tracks\":[]}")) {
            write(index,broken);fails(()->new LocalLibrary(files));assertArrayEquals(original,Files.readAllBytes(saved.toPath()));assertEquals(broken,read(index));
        }
    }
    @Test public void trailingGarbageCannotTurnADamagedIndexIntoAnEmptyLibrary()throws Exception {
        LocalLibrary library=new LocalLibrary(files);File saved=add(library,0);byte[] audio=Files.readAllBytes(saved.toPath());
        String broken="{\"version\":1,\"revision\":1,\"tracks\":[]}trailing garbage";write(index,broken);
        fails(()->new LocalLibrary(files));assertArrayEquals(audio,Files.readAllBytes(saved.toPath()));assertEquals(broken,read(index));
    }
    @Test public void fractionalAndWrongTypeMetadataNeverTriggerDestructiveRepair()throws Exception {
        LocalLibrary library=new LocalLibrary(files);File saved=add(library,0);String valid=read(index);byte[] bytes=Files.readAllBytes(saved.toPath());
        for(String key:List.of("bytes","duration","title","source","revision","version")) {
            JSONObject broken=new JSONObject(valid);JSONObject object=key.equals("version")||key.equals("revision")?broken:broken.getJSONArray("tracks").getJSONObject(0);
            if(key.equals("bytes"))object.put(key,11.9);else if(key.equals("duration"))object.put(key,"180");else if(key.equals("version"))object.put(key,1.5);
            else if(key.equals("revision"))object.put(key,"1");else object.put(key,123);
            write(index,broken.toString());fails(()->new LocalLibrary(files));assertArrayEquals(bytes,Files.readAllBytes(saved.toPath()));
        }
    }
    @Test public void finalRevisionRemainsReadableAndFurtherCommitsFailWithoutDataLoss()throws Exception {
        LocalLibrary library=new LocalLibrary(files);File first=add(library,0);JSONObject document=new JSONObject(read(index));document.put("revision",Long.MAX_VALUE-1);write(index,document.toString());
        library=new LocalLibrary(files);File second=add(library,1);assertEquals(Long.MAX_VALUE,library.revision());LocalLibrary restored=new LocalLibrary(files);
        assertEquals(List.of(track(0).id,track(1).id),ids(restored));assertEquals(Long.MAX_VALUE,restored.revision());fails(()->restored.save(track(2),temporary()));assertTrue(first.exists());assertTrue(second.exists());
        assertEquals(List.of(track(0).id,track(1).id),ids(new LocalLibrary(files)));
    }
    @Test public void missingIndexPreservesAudioAndEvictionFilesForRecovery()throws Exception {
        LocalLibrary library=new LocalLibrary(files);File saved=add(library,0);assertTrue(index.delete());fails(()->new LocalLibrary(files));assertTrue(saved.exists());assertFalse(index.exists());
        Files.move(saved.toPath(),tomb(saved).toPath());fails(()->new LocalLibrary(files));assertTrue(tomb(saved).exists());assertFalse(index.exists());
    }
    @Test public void metadataCannotInjectPathsOrClaimArbitraryFiles()throws Exception {
        LocalLibrary library=new LocalLibrary(files);File saved=add(library,0);File outside=new File(files,"outside.audio");Files.write(outside.toPath(),new byte[]{1});
        JSONObject document=new JSONObject(read(index));document.getJSONArray("tracks").getJSONObject(0).put("id","../outside.audio");write(index,document.toString());
        fails(()->new LocalLibrary(files));assertTrue(saved.exists());assertTrue(outside.exists());
    }
    @Test public void duplicateSaveCannotDeleteAnotherPermanentSong()throws Exception {
        LocalLibrary library=new LocalLibrary(files);File first=add(library,0),second=add(library,1);long revision=library.revision();
        fails(()->library.save(track(0),second));assertTrue(first.exists());assertTrue(second.exists());assertEquals(revision,library.revision());
        assertEquals(first,library.save(track(0),first));assertTrue(first.exists());assertEquals(2,library.tracks().size());
    }
    @Test public void invalidTemporaryFilesNeverChangeLibraryAndCapacityCannotBeBypassed()throws Exception {
        LocalLibrary library=new LocalLibrary(files);File empty=File.createTempFile("empty-",".audio",cache);long revision=library.revision();
        fails(()->library.save(track(0),empty));assertTrue(library.tracks().isEmpty());assertEquals(revision,library.revision());fill(library);
        File downloaded=temporary();fails(()->library.save(track(50),downloaded));assertTrue(downloaded.exists());assertEquals(50,library.tracks().size());
    }
    @Test public void temporaryDownloaderCleanupCannotDeletePersistentLibrarySongs()throws Exception {
        LocalLibrary library=new LocalLibrary(files);File saved=add(library,0);File temporaryDir=new File(cache,"hifini-audio");assertTrue(temporaryDir.mkdirs());
        File transientFile=new File(temporaryDir,"audio-old.audio");Files.write(transientFile.toPath(),new byte[]{1});AudioDownloader.cleanCache(cache);
        assertFalse(transientFile.exists());assertTrue(saved.exists());assertEquals(saved,new LocalLibrary(files).find(track(0).id));
    }
}
