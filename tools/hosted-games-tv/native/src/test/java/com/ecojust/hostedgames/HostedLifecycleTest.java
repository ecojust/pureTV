package com.ecojust.hostedgames;

import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;
import static org.robolectric.util.ReflectionHelpers.getField;

import android.app.AlertDialog;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.Button;

import com.ecojust.gamekit.LanGameServer;
import com.ecojust.gamekit.WifiControllerServer;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.Implementation;
import org.robolectric.annotation.Implements;
import org.robolectric.annotation.LooperMode;
import org.robolectric.shadows.ShadowNsdManager;

import java.net.ConnectException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;
import java.util.function.BooleanSupplier;

/** Uses real TCP sockets and the Android framework shadows for NSD and WebView. */
@RunWith(RobolectricTestRunner.class)
@Config(
        sdk = 28,
        qualifiers = "zh-rCN-w960dp-h540dp-land",
        shadows = HostedLifecycleTest.RecordingNsd.class)
@LooperMode(LooperMode.Mode.PAUSED)
public class HostedLifecycleTest {
    @Implements(NsdManager.class)
    public static class RecordingNsd extends ShadowNsdManager {
        static final List<NsdManager.RegistrationListener> advertised = new ArrayList<>(),
                withdrawn = new ArrayList<>();

        @Implementation
        protected void registerService(
                NsdServiceInfo s, int protocol, NsdManager.RegistrationListener l) {
            advertised.add(l);
            l.onServiceRegistered(s);
        }

        @Implementation
        protected void unregisterService(NsdManager.RegistrationListener l) {
            withdrawn.add(l);
        }
    }

    static void until(String description, BooleanSupplier condition) throws Exception {
        long deadline = System.nanoTime() + 10_000_000_000L;
        do {
            shadowOf(Looper.getMainLooper()).idle();
            if (condition.getAsBoolean()) return;
            Thread.sleep(15);
        } while (System.nanoTime() < deadline);
        fail(description);
    }

    static int port(HostedControllerRoom room, String type) {
        return getField(room, type + "Port");
    }

    static Button findButton(View view, String title) {
        if (view instanceof Button && title.contentEquals(((Button) view).getText()))
            return (Button) view;
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                Button child = findButton(group.getChildAt(i), title);
                if (child != null) return child;
            }
        }
        return null;
    }

    static boolean accepting(int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress("127.0.0.1", port), 250);
            return true;
        } catch (ConnectException down) {
            return false;
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }

    @Test
    public void topLevelNavigationFallbackRestartsAtOriginalAuthor() throws Exception {
        ActivityController<MainActivity> lifecycle = Robolectric.buildActivity(MainActivity.class);
        MainActivity activity = lifecycle.setup().visible().windowFocusChanged(true).get();
        try {
            findButton(activity.getWindow().getDecorView(), "鱼群环线").performClick();
            for (int stage = 0; stage < 2; stage++) {
                WebView web = getField(activity, "web");
                String original = shadowOf(web).getLastLoadedUrl();
                web.getWebViewClient().onPageStarted(web, original, null);
                web.getWebViewClient().onPageCommitVisible(web, original);
                assertSame(web, getField(activity, "web"));
                if (stage == 0)
                    web.getWebViewClient().onPageStarted(web, "https://other.example/", null);
                else web.getWebViewClient().onPageCommitVisible(web, "https://other.example/");
                assertEquals(View.INVISIBLE, web.getVisibility());
                until(
                        "Native retry",
                        () -> findButton(activity.getWindow().getDecorView(), "重试") != null);
                assertNull(getField(activity, "web"));
                findButton(activity.getWindow().getDecorView(), "重试").performClick();
                WebView resumed = getField(activity, "web");
                assertNotSame(web, resumed);
                assertEquals(original, shadowOf(resumed).getLastLoadedUrl());
            }
        } finally {
            lifecycle.pause().stop().destroy();
        }
    }

    @Test
    public void stopWithdrawsRoomAndResumePreservesWebAndGuide() throws Exception {
        RecordingNsd.advertised.clear();
        RecordingNsd.withdrawn.clear();
        ActivityController<MainActivity> lifecycle = Robolectric.buildActivity(MainActivity.class);
        MainActivity activity =
                lifecycle.create().start().resume().visible().windowFocusChanged(true).get();
        try {
            HostedControllerRoom room = getField(activity, "room");
            assertNotNull("Production catalog loaded", room);
            until("HTTP/TCP ready", () -> port(room, "phone") > 0 && port(room, "wifi") > 0);
            int http = port(room, "phone"), tcp = port(room, "wifi");
            LanGameServer first = getField(room, "phone");
            assertTrue(accepting(http));
            assertTrue(accepting(tcp));
            assertEquals(1, RecordingNsd.advertised.size());
            Button fish = findButton(activity.getWindow().getDecorView(), "鱼群环线");
            assertNotNull(fish);
            assertTrue(fish.performClick());
            WebView web = getField(activity, "web");
            String url = shadowOf(web).getLastLoadedUrl();
            assertEquals("https://huykc1.github.io/fish-loop-phaser-demo/demo/", url);
            activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_MENU));
            AlertDialog guide = getField(activity, "helpDialog");
            assertNotNull(guide);
            assertTrue(guide.isShowing());
            lifecycle.windowFocusChanged(false).pause().stop();
            until("Old ports closed", () -> !accepting(http) && !accepting(tcp));
            assertEquals(1, RecordingNsd.withdrawn.size());
            assertSame(RecordingNsd.advertised.get(0), RecordingNsd.withdrawn.get(0));
            lifecycle.restart().start().resume().visible().windowFocusChanged(true);
            until("New room accepting", () -> port(room, "phone") > 0 && port(room, "wifi") > 0);
            assertTrue(accepting(port(room, "phone")));
            assertTrue(accepting(port(room, "wifi")));
            LanGameServer current = getField(room, "phone");
            assertNotSame(first, current);
            assertNotEquals(first.roomToken(), current.roomToken());
            if (tcp == WifiControllerServer.DEFAULT_PORT) assertEquals(tcp, port(room, "wifi"));
            assertEquals(2, RecordingNsd.advertised.size());
            assertSame(web, getField(activity, "web"));
            assertEquals(url, shadowOf(web).getLastLoadedUrl());
            assertEquals("fish-loop", getField(activity, "selection"));
            assertSame(guide, getField(activity, "helpDialog"));
            assertTrue(guide.isShowing());
        } finally {
            lifecycle.pause().stop().destroy();
        }
    }
}
