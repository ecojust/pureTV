package com.ecojust.gamekit;

import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.os.Handler;
import android.os.Looper;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.Implementation;
import org.robolectric.annotation.Implements;
import org.robolectric.annotation.LooperMode;
import org.robolectric.annotation.Resetter;
import org.robolectric.shadows.ShadowNsdManager;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import static org.junit.Assert.*;

/** Records the real NsdManager boundary. This is not a multicast or physical ESP32 test. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk=28, manifest=Config.NONE, shadows=WifiControllerDiscoveryTest.RecordingNsdShadow.class)
@LooperMode(LooperMode.Mode.PAUSED)
public class WifiControllerDiscoveryTest {
    public static final class Registration {
        public final NsdServiceInfo service;
        public final int protocol;
        public final NsdManager.RegistrationListener listener;
        Registration(NsdServiceInfo service,int protocol,NsdManager.RegistrationListener listener) {
            this.service=service;this.protocol=protocol;this.listener=listener;
        }
    }
    @Implements(NsdManager.class)
    public static class RecordingNsdShadow extends ShadowNsdManager {
        public static final List<Registration> registrations=new ArrayList<>();
        public static final List<NsdManager.RegistrationListener> unregisters=new ArrayList<>();
        public static boolean autoRegister, throwRegister, throwUnregister;
        public static int registrationError=-1;
        public static Consumer<NsdServiceInfo> onRegister;
        @Resetter public static void reset() {
            registrations.clear();unregisters.clear();autoRegister=false;
            throwRegister=false;throwUnregister=false;registrationError=-1;onRegister=null;
        }
        @Implementation protected void registerService(NsdServiceInfo service,int protocol,NsdManager.RegistrationListener listener) {
            if(throwRegister)throw new IllegalArgumentException("Synthetic platform registration failure");
            registrations.add(new Registration(service,protocol,listener));
            if(onRegister!=null)onRegister.accept(service);
            if(autoRegister)new Handler(Looper.getMainLooper()).post(()->{
                if(registrationError>=0)listener.onRegistrationFailed(service,registrationError);
                else listener.onServiceRegistered(service);
            });
        }
        @Implementation protected void unregisterService(NsdManager.RegistrationListener listener) {
            unregisters.add(listener);
            if(throwUnregister)throw new IllegalArgumentException("Synthetic pending registration");
        }
    }
    private WifiControllerDiscovery discovery;
    private final List<String> states=new ArrayList<>();
    @Before public void create() {
        RecordingNsdShadow.reset();
        discovery=new WifiControllerDiscovery(RuntimeEnvironment.getApplication(),(state,name,port,error)->
                states.add(state+"|"+name+"|"+port+"|"+error));
    }
    @After public void close() { discovery.close(); }
    private Registration last() { return RecordingNsdShadow.registrations.get(RecordingNsdShadow.registrations.size()-1); }

    @Test public void registersExactProtocolFieldsAndKeepsActualBoundPortOnRename() {
        discovery.start("霓虹飞车",43123);Registration request=last();
        assertEquals("_puretv._tcp",request.service.getServiceType());
        assertEquals("霓虹飞车",request.service.getServiceName());assertEquals(43123,request.service.getPort());
        assertEquals(NsdManager.PROTOCOL_DNS_SD,request.protocol);
        assertEquals("1",new String(request.service.getAttributes().get("version"),StandardCharsets.UTF_8));
        NsdServiceInfo renamed=new NsdServiceInfo();renamed.setServiceName("霓虹飞车 (2)");renamed.setPort(99);
        request.listener.onServiceRegistered(renamed);
        assertEquals("available|霓虹飞车 (2)|43123|0",states.get(states.size()-1));
        discovery.stop();assertSame(request.listener,RecordingNsdShadow.unregisters.get(0));
        int calls=RecordingNsdShadow.unregisters.size();discovery.stop();assertEquals(calls,RecordingNsdShadow.unregisters.size());
    }

    @Test public void lateSuccessAfterStopIsWithdrawnEvenIfFirstUnregisterWasPending() {
        discovery.start("TV",43210);Registration request=last();RecordingNsdShadow.throwUnregister=true;
        discovery.stop();RecordingNsdShadow.throwUnregister=false;request.listener.onServiceRegistered(request.service);
        assertEquals(2,RecordingNsdShadow.unregisters.size());
        assertSame(request.listener,RecordingNsdShadow.unregisters.get(0));assertSame(request.listener,RecordingNsdShadow.unregisters.get(1));
        assertTrue(states.stream().noneMatch(state->state.startsWith("available|")));
    }

    @Test public void previousGenerationCallbackCannotPromoteOrCancelNewRegistration() {
        discovery.start("Old",43001);Registration old=last();discovery.start("New",43002);Registration current=last();
        old.listener.onServiceRegistered(old.service);old.listener.onRegistrationFailed(old.service,7);
        assertTrue(states.stream().noneMatch(state->state.startsWith("available|Old")));
        current.listener.onServiceRegistered(current.service);assertEquals("available|New|43002|0",states.get(states.size()-1));
        discovery.stop();assertSame(current.listener,RecordingNsdShadow.unregisters.get(RecordingNsdShadow.unregisters.size()-1));
    }

    @Test public void asynchronousFailureReportsUnavailableAndLateSuccessIsStillWithdrawn() {
        discovery.start("TV",43003);Registration request=last();request.listener.onRegistrationFailed(request.service,6);
        assertEquals("unavailable|TV|43003|6",states.get(states.size()-1));
        request.listener.onServiceRegistered(request.service);assertSame(request.listener,RecordingNsdShadow.unregisters.get(0));
        assertTrue(states.stream().noneMatch(state->state.startsWith("available|")));
    }

    @Test public void synchronousPlatformFailureIsReportedWithoutEscaping() {
        RecordingNsdShadow.throwRegister=true;discovery.start("TV",43004);
        assertEquals("unavailable|TV|43004|-1",states.get(states.size()-1));
        assertTrue(RecordingNsdShadow.registrations.isEmpty());
    }

    @Test public void invalidListenerPortsAreRejectedWithoutAdvertisement() {
        for(int port:new int[]{-1,0,65536}){
            try{discovery.start("TV",port);fail("Invalid port accepted");}catch(IllegalArgumentException expected){}
        }
        assertTrue(RecordingNsdShadow.registrations.isEmpty());
    }

    @Test public void unregistrationFailureNeverResurrectsAStoppedService() {
        discovery.start("TV",43005);Registration request=last();request.listener.onServiceRegistered(request.service);
        discovery.stop();request.listener.onUnregistrationFailed(request.service,2);
        assertEquals("stopped|TV|43005|0",states.get(states.size()-1));assertEquals(1,RecordingNsdShadow.registrations.size());
    }
}
