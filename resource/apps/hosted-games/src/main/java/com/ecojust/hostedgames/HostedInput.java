package com.ecojust.hostedgames;

import android.app.Activity;
import android.hardware.input.InputManager;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.util.SparseArray;
import android.view.InputDevice;
import android.view.KeyCharacterMap;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.Toast;

import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;

/** Routes only normal Android key, touch and mouse events into the author's WebView. */
final class HostedInput implements InputManager.InputDeviceListener, AutoCloseable {
    static final int LEFT = 1, RIGHT = 2, UP = 4, DOWN = 8, A = 16, B = 32, X = 64, Y = 128, START = 256;
    private static final float DEAD_ZONE = .2f;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final String id;
    private final Runnable toggleHelp;
    private final WebView web;
    private final GamePointer pointer;
    private final HostedControllerRoom room;
    private final InputManager inputManager;
    private final SparseArray<Pad> devices = new SparseArray<>();
    private final Pad phone = new Pad(), wifi = new Pad();
    private final Map<Integer, Long> heldKeys = new HashMap<>();
    private int previous;
    private boolean drive, lookMode, active, closed, waitForNeutral;
    private long previousTime;
    private Toast modeToast;

    HostedInput(Activity activity, FrameLayout layer, WebView web, String gameId, Runnable toggleHelp, HostedControllerRoom room) {
        this.web = web;
        id = gameId;
        this.toggleHelp = toggleHelp;
        pointer = new GamePointer(layer, web);
        this.room = room;
        inputManager = activity.getSystemService(InputManager.class);
        inputManager.registerInputDeviceListener(this, handler);
    }

    boolean canSwitchMode() { return id.equals("bandit") || id.equals("noir-extreme") || id.equals("struggle-bus"); }
    String modeLabel() {
        if (lookMode) return "观察模式";
        if (!drive) return "光标模式";
        return id.equals("struggle-bus") ? "驾驶模式" : "移动模式";
    }

    String help() {
        String common = "方向键或左摇杆移动光标，确定 / A 点击，按住并移动可拖动。";
        String profile;
        switch (id) {
            case "bandit": profile = "进入房间后切换到移动模式。方向控制移动，A 互动，X 冲刺，Y 使用技能。"; break;
            case "noir-extreme": profile = "点击 BEGIN 后可切到移动模式。方向控制移动，A 互动，Y 发送 Esc。使用观察模式的方向键、移动模式的右摇杆或按住 X 加方向转动视角。原作需要支持鼠标锁定的 WebView。"; break;
            case "struggle-bus": profile = "起飞后切到驾驶模式。左右转向，上俯冲，下爬升，A 喷彩，X 升档，Y 降档。"; break;
            case "fish-loop": profile = "将光标移到鱼车上，按确定放鱼。"; break;
            case "vespertine": profile = "移动光标划船，点击或按 X 点灯，Y 回岸。"; break;
            default: profile = "用光标选择学科、小游戏或配料，X 推进对白。";
        }
        String mode = canSwitchMode() ? "按 B、播放/暂停键或在帮助面板切换模式。" : "";
        return common + profile + mode + " 按菜单键或手柄 Start 打开操作说明。";
    }

    float cursorX() { return pointer.cursorX(); }
    float cursorY() { return pointer.cursorY(); }

    String[] auxActions() {
        switch (id) {
            case "bandit": return new String[] {"使用技能（Q）"};
            case "noir-extreme": return new String[] {"原作暂停（Esc）"};
            case "struggle-bus": return new String[] {"升档（E）", "降档（Q）"};
            case "vespertine": return new String[] {"放出灯火", "回到岸边"};
            case "daejeon-campus": return new String[] {"推进对白"};
            default: return new String[0];
        }
    }

    void tapAux(int index) {
        if (closed || index < 0 || index >= auxActions().length) return;
        int key;
        switch (id) {
            case "bandit": key = KeyEvent.KEYCODE_Q; break;
            case "noir-extreme": key = KeyEvent.KEYCODE_ESCAPE; break;
            case "struggle-bus": key = index == 0 ? KeyEvent.KEYCODE_E : KeyEvent.KEYCODE_Q; break;
            case "vespertine": key = index == 0 ? KeyEvent.KEYCODE_SPACE : KeyEvent.KEYCODE_ESCAPE; break;
            default: key = KeyEvent.KEYCODE_ENTER;
        }
        web.requestFocus();
        hold(key, true);
        handler.postDelayed(() -> { if (!closed) hold(key, false); }, 70);
    }

    void setActive(boolean enabled) {
        if (active == enabled || closed) return;
        active = enabled;
        handler.removeCallbacks(frame);
        if (active) handler.post(frame);
        else devices.clear();
        resetOutput();
        pointer.show(active && !drive);
    }

    void toggleMode() {
        if (!canSwitchMode() || closed) return;
        if (drive && !lookMode && id.equals("noir-extreme")) lookMode = true;
        else { drive = !drive; lookMode = false; }
        resetOutput();
        pointer.show(active && !drive);
        if (modeToast != null) modeToast.cancel();
        modeToast = Toast.makeText(web.getContext(), modeLabel(), Toast.LENGTH_SHORT);
        modeToast.show();
    }

    private Pad device(int id) {
        Pad pad = devices.get(id);
        if (pad == null) { pad = new Pad(); devices.put(id, pad); }
        return pad;
    }

    boolean key(KeyEvent event) {
        int bit = bit(event.getKeyCode());
        if (bit == 0 || closed) return false;
        Pad pad = device(event.getDeviceId());
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            if (event.getRepeatCount() == 0 && active) pad.buttons |= bit;
        } else if (event.getAction() == KeyEvent.ACTION_UP) {
            pad.buttons &= ~bit;
            if (event.isCanceled()) resetOutput();
        } else return false;
        if (!active) return false;
        render(0);
        return true;
    }

    private static int bit(int key) {
        switch (key) {
            case KeyEvent.KEYCODE_DPAD_LEFT: return LEFT;
            case KeyEvent.KEYCODE_DPAD_RIGHT: return RIGHT;
            case KeyEvent.KEYCODE_DPAD_UP: return UP;
            case KeyEvent.KEYCODE_DPAD_DOWN: return DOWN;
            case KeyEvent.KEYCODE_DPAD_CENTER: case KeyEvent.KEYCODE_BUTTON_A: return A;
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE: case KeyEvent.KEYCODE_BUTTON_B: return B;
            case KeyEvent.KEYCODE_BUTTON_X: return X;
            case KeyEvent.KEYCODE_BUTTON_Y: return Y;
            case KeyEvent.KEYCODE_MENU: case KeyEvent.KEYCODE_BUTTON_START: return START;
            default: return 0;
        }
    }

    boolean motion(MotionEvent event) {
        if (closed || !event.isFromSource(InputDevice.SOURCE_JOYSTICK) || event.getAction() != MotionEvent.ACTION_MOVE)
            return false;
        Pad pad = device(event.getDeviceId());
        pad.x = stronger(event.getAxisValue(MotionEvent.AXIS_X), event.getAxisValue(MotionEvent.AXIS_HAT_X));
        pad.y = stronger(event.getAxisValue(MotionEvent.AXIS_Y), event.getAxisValue(MotionEvent.AXIS_HAT_Y));
        pad.lookX = event.getAxisValue(MotionEvent.AXIS_Z);
        pad.lookY = event.getAxisValue(MotionEvent.AXIS_RZ);
        if (active) render(0);
        return active;
    }

    @Override public void onInputDeviceAdded(int id) {}
    @Override public void onInputDeviceChanged(int id) {}
    @Override public void onInputDeviceRemoved(int id) {
        if (devices.get(id) != null) { devices.remove(id); resetOutput(); }
    }

    private final Runnable frame = new Runnable() {
        @Override public void run() {
            if (closed || !active) return;
            boolean cancelled = phone.read(room.readPhone());
            cancelled |= wifi.read(room.readWifi());
            if (cancelled) resetOutput();
            long now = SystemClock.uptimeMillis();
            render(Math.min(50, now - previousTime));
            previousTime = now;
            if (!closed && active) handler.postDelayed(this, 32);
        }
    };

    private void render(long elapsedMs) {
        int buttons = phone.buttons | wifi.buttons;
        float x = stronger(phone.x, wifi.x), y = stronger(phone.y, wifi.y);
        float lookX = 0, lookY = 0;
        for (int i = 0; i < devices.size(); i++) {
            Pad pad = devices.valueAt(i);
            buttons |= pad.buttons;
            x = stronger(x, pad.x); y = stronger(y, pad.y);
            lookX = stronger(lookX, pad.lookX); lookY = stronger(lookY, pad.lookY);
        }
        if ((buttons & (LEFT | RIGHT)) != 0) x = direction(buttons, RIGHT, LEFT);
        if ((buttons & (UP | DOWN)) != 0) y = direction(buttons, DOWN, UP);
        if (Math.abs(x) < DEAD_ZONE) x = 0;
        if (Math.abs(y) < DEAD_ZONE) y = 0;
        int edges = buttons & ~previous;
        previous = buttons;
        if (waitForNeutral) {
            if (buttons == 0 && x == 0 && y == 0) waitForNeutral = false;
            return;
        }
        if ((edges & START) != 0 && active) {
            resetOutput();
            toggleHelp.run();
            return;
        }
        if (!active) return;
        if ((edges & B) != 0 && canSwitchMode()) { toggleMode(); return; }

        boolean bus = id.equals("struggle-bus");
        if (drive) {
            if (id.equals("noir-extreme")) {
                if (lookMode || (buttons & X) != 0) { lookX = x; lookY = y; x = 0; y = 0; }
                if (elapsedMs > 0 && (Math.abs(lookX) > DEAD_ZONE || Math.abs(lookY) > DEAD_ZONE))
                    pointer.look(lookX * elapsedMs, lookY * elapsedMs);
            }
            hold(KeyEvent.KEYCODE_A, x < -DEAD_ZONE);
            hold(KeyEvent.KEYCODE_D, x > DEAD_ZONE);
            hold(KeyEvent.KEYCODE_W, y < -DEAD_ZONE);
            hold(KeyEvent.KEYCODE_S, y > DEAD_ZONE);
            hold(bus ? KeyEvent.KEYCODE_SPACE : KeyEvent.KEYCODE_E, (buttons & A) != 0);
            if (bus) hold(KeyEvent.KEYCODE_E, (buttons & X) != 0);
            else if (id.equals("bandit")) hold(KeyEvent.KEYCODE_SHIFT_LEFT, (buttons & X) != 0);
            hold(id.equals("noir-extreme") ? KeyEvent.KEYCODE_ESCAPE : KeyEvent.KEYCODE_Q, (buttons & Y) != 0);
        } else {
            // Give short D-pad taps one visible step even when both key events arrive between frames.
            boolean nudged = (edges & (LEFT | RIGHT | UP | DOWN)) != 0;
            if ((x != 0 || y != 0) && (nudged || elapsedMs > 0)) {
                float step = Math.max(web.getWidth(), web.getHeight()) * (nudged ? .009f : elapsedMs * .00043f);
                float scale = Math.max(1f, (float) Math.hypot(x, y));
                pointer.move(x * step / scale, y * step / scale);
            }
            pointer.press((buttons & A) != 0);
            if (id.equals("vespertine")) {
                hold(KeyEvent.KEYCODE_SPACE, (buttons & X) != 0);
                hold(KeyEvent.KEYCODE_ESCAPE, (buttons & Y) != 0);
            } else if (id.equals("daejeon-campus")) hold(KeyEvent.KEYCODE_ENTER, (buttons & X) != 0);
        }
    }

    private static int direction(int buttons, int positive, int negative) {
        return ((buttons & positive) != 0 ? 1 : 0) - ((buttons & negative) != 0 ? 1 : 0);
    }

    private static float stronger(float a, float b) { return Math.abs(a) >= Math.abs(b) ? a : b; }

    private void hold(int key, boolean pressed) {
        Long down = heldKeys.get(key);
        if ((down != null) == pressed) return;
        long now = SystemClock.uptimeMillis();
        if (pressed) { down = now; heldKeys.put(key, down); }
        else heldKeys.remove(key);
        web.dispatchKeyEvent(new KeyEvent(down, now, pressed ? KeyEvent.ACTION_DOWN : KeyEvent.ACTION_UP, key, 0,
                heldKeys.containsKey(KeyEvent.KEYCODE_SHIFT_LEFT) ? KeyEvent.META_SHIFT_ON : 0,
                KeyCharacterMap.VIRTUAL_KEYBOARD, scanCode(key), 0, InputDevice.SOURCE_KEYBOARD));
    }

    // Chromium derives DOM KeyboardEvent.code from the physical (Linux evdev) scan code.
    private static int scanCode(int key) {
        switch (key) {
            case KeyEvent.KEYCODE_ESCAPE: return 1;
            case KeyEvent.KEYCODE_Q: return 16;
            case KeyEvent.KEYCODE_W: return 17;
            case KeyEvent.KEYCODE_E: return 18;
            case KeyEvent.KEYCODE_ENTER: return 28;
            case KeyEvent.KEYCODE_A: return 30;
            case KeyEvent.KEYCODE_S: return 31;
            case KeyEvent.KEYCODE_D: return 32;
            case KeyEvent.KEYCODE_SHIFT_LEFT: return 42;
            case KeyEvent.KEYCODE_SPACE: return 57;
            default: throw new IllegalArgumentException("Unmapped keyboard code " + key);
        }
    }

    private void resetOutput() {
        pointer.cancel();
        for (Integer key : heldKeys.keySet().toArray(new Integer[0])) hold(key, false);
        waitForNeutral = true;
    }

    @Override public void close() {
        if (closed) return;
        closed = true;
        resetOutput();
        handler.removeCallbacks(frame);
        inputManager.unregisterInputDeviceListener(this);
        if (modeToast != null) modeToast.cancel();
        pointer.remove();
    }

    static final class Pad {
        int buttons;
        float x, y, lookX, lookY;
        boolean connected;
        long cancel;

        boolean read(JSONObject player) {
            boolean live = player != null && player.optBoolean("connected");
            long seq = live ? player.optLong("cancelSeq") : 0;
            boolean changed = connected && (!live || seq != cancel);
            connected = live;
            cancel = seq;
            buttons = 0; x = 0; y = 0;
            if (live) {
                JSONObject raw = player.optJSONObject("buttons");
                x = (float) player.optDouble("x", 0); y = (float) player.optDouble("y", 0);
                if (raw != null) {
                    if (raw.optBoolean("A")) buttons |= A;
                    if (raw.optBoolean("B")) buttons |= B;
                    if (raw.optBoolean("X")) buttons |= X;
                    if (raw.optBoolean("Y")) buttons |= Y;
                    if (raw.optBoolean("START")) buttons |= START;
                } else {
                    if (player.optBoolean("a")) buttons |= A;
                    if (player.optBoolean("b")) buttons |= B;
                    if (player.optBoolean("buttonX")) buttons |= X;
                    if (player.optBoolean("buttonY")) buttons |= Y;
                    if (player.optBoolean("start")) buttons |= START;
                }
            }
            return changed;
        }
    }
}
