package com.ecojust.operatv;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.StateListDrawable;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

/** Shared native view styling; all dimensions are density independent. */
public final class Ui {
    public static final int BG=0xff111d1b, PANEL=0xff1b2c28, CARD=0xff213630, TEXT=0xfff4efdf,
        MUTED=0xffb9c6b8, GOLD=0xffe8bd74, LINE=0xff426052, INK=0xff17221c;
    private Ui() {}
    public static int dp(Context c,float value){return Math.round(value*c.getResources().getDisplayMetrics().density);}
    public static String tr(Context c,String zh,String en){return "zh".equals(c.getResources().getConfiguration().locale.getLanguage())?zh:en;}
    public static LinearLayout column(Context c){LinearLayout l=new LinearLayout(c);l.setOrientation(LinearLayout.VERTICAL);return l;}
    public static LinearLayout row(Context c){LinearLayout l=new LinearLayout(c);l.setOrientation(LinearLayout.HORIZONTAL);l.setGravity(Gravity.CENTER_VERTICAL);return l;}
    public static TextView text(Context c,String value,int sp,int color){TextView t=new TextView(c);t.setText(value);t.setTextSize(sp);t.setTextColor(color);t.setGravity(Gravity.CENTER_VERTICAL);return t;}
    public static GradientDrawable shape(Context c,int fill,int border,int stroke){GradientDrawable d=new GradientDrawable();d.setColor(fill);d.setCornerRadius(dp(c,9));d.setStroke(dp(c,stroke),border);return d;}
    public static StateListDrawable focus(Context c,boolean selected){StateListDrawable d=new StateListDrawable();d.addState(new int[]{android.R.attr.state_focused},shape(c,GOLD,GOLD,3));d.addState(new int[]{android.R.attr.state_pressed},shape(c,GOLD,GOLD,3));d.addState(new int[]{},shape(c,selected?0xff344d3e:PANEL,selected?GOLD:LINE,1));return d;}
    public static ColorStateList focusText(){return new ColorStateList(new int[][]{new int[]{android.R.attr.state_focused},new int[]{android.R.attr.state_pressed},new int[]{}},new int[]{INK,INK,TEXT});}
    public static Button button(Context c,String label,String key,View.OnClickListener action){Button b=new Button(c);b.setText(label);b.setTextSize(16);b.setAllCaps(false);b.setTypeface(null,Typeface.BOLD);b.setTextColor(focusText());b.setBackground(focus(c,false));b.setPadding(dp(c,14),dp(c,6),dp(c,14),dp(c,6));b.setMinimumHeight(0);b.setMinimumWidth(0);b.setMinHeight(0);b.setMinWidth(0);b.setFocusable(true);b.setFocusableInTouchMode(false);b.setTag(key);b.setContentDescription(key);b.setOnClickListener(action);return b;}
}
