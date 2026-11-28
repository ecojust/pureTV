package com.ecojust.tvqa;

import com.android.uiautomator.testrunner.UiAutomatorTestCase;

/** Snapshot the active window even while a game is animating. Runs only on the QA emulator. */
@SuppressWarnings("deprecation")
public final class WindowSnapshot extends UiAutomatorTestCase {
    public void testSnapshot() {
        // UiDevice reads getRootInActiveWindow() directly and writes standard accessibility XML.
        getUiDevice().dumpWindowHierarchy("puretv-hosted-qa.xml");
    }
}
