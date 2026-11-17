package com.ecojust.puretv;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.BitmapFactory;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/** The same 960x540 scene consumed by the manager. No device-specific layout offsets. */
final class LayoutScene extends FrameLayout {
    private final Activity activity;
    private final RecyclerView grid;
    private final List<View> nodes=new ArrayList<>();
    private final List<JSONObject> specs=new ArrayList<>();
    private JSONObject page;
    private String section;
    private final List<AppAdapter.Holder> cards=new ArrayList<>();
    private AppAdapter boundAdapter;
    private JSONObject navigation=new JSONObject();
    private boolean modern;
    private final java.util.Map<String,android.graphics.drawable.Drawable> icons=new java.util.HashMap<>();
    private static android.graphics.drawable.Drawable focusSurface(int color) {
        android.graphics.drawable.GradientDrawable focused=new android.graphics.drawable.GradientDrawable();focused.setColor((color&0xFFFFFF)|0x16000000);focused.setCornerRadius(14);focused.setStroke(2,color);
        android.graphics.drawable.StateListDrawable states=new android.graphics.drawable.StateListDrawable();states.addState(new int[]{android.R.attr.state_focused},focused);states.addState(new int[]{android.R.attr.state_pressed},focused);states.addState(new int[]{},new android.graphics.drawable.ColorDrawable(Color.TRANSPARENT));return states;
    }
    private int columns=4,designWidth=960,designHeight=540;
    LayoutScene(Activity activity,FrameLayout root,RecyclerView grid,String section) {
        super(activity);this.activity=activity;this.grid=grid;root.setBackgroundColor(Color.BLACK);
        // Detach the existing controls, retaining their listeners and live clock/network/weather state.
        String[] ids=section.equals("home")?new String[]{"clock","date","weather","wallpaper","favourites","inputs","network","settings","allApps"}:new String[]{"title","subtitle","backHome"};
        int[] resources=section.equals("home")?new int[]{R.id.clock,R.id.date,R.id.weatherLine,R.id.btnWallpaper,R.id.btnDock,R.id.btnInputs,R.id.btnWifi,R.id.btnSettings,R.id.allAppsHint}:new int[]{R.id.appsTitle,R.id.appsSubtitle,R.id.backHome};
        for(int i=0;i<ids.length;i++) {
            View view=activity.findViewById(resources[i]);((ViewGroup)view.getParent()).removeView(view);
            if(ids[i].equals("allApps"))view.setFocusable(true);
            view.setNextFocusLeftId(View.NO_ID);view.setNextFocusRightId(View.NO_ID);view.setNextFocusUpId(View.NO_ID);view.setNextFocusDownId(View.NO_ID);
            FrameLayout wrapper=new FrameLayout(activity);wrapper.setTag(ids[i]);wrapper.setClipChildren(false);
            wrapper.addView(view,new FrameLayout.LayoutParams(-1,-1));nodes.add(wrapper);
        }
        ((ViewGroup)grid.getParent()).removeView(grid);
        for(int i=0;i<root.getChildCount();i++) if(!(root.getChildAt(i) instanceof ImageView))root.getChildAt(i).setVisibility(GONE);
        setClipChildren(false);grid.setClipChildren(false);grid.setPadding(0,0,0,0);grid.setOverScrollMode(OVER_SCROLL_NEVER);
        addView(grid,new FrameLayout.LayoutParams(-1,-1));grid.setVisibility(INVISIBLE);
        for(View node:nodes)addView(node);
        root.addView(this,new FrameLayout.LayoutParams(-1,-1));
    }
    void apply(LauncherLayout layout,String section) {
        this.section=section;navigation=layout.json.optJSONObject(section).optJSONObject("navigation");if(navigation==null)navigation=new JSONObject();designWidth=layout.screenWidth();designHeight=layout.screenHeight();page=layout.page(section);columns=layout.columns(section);specs.clear();
        JSONArray elements=page.optJSONObject("scene").optJSONArray("elements");
        for(View node:nodes){JSONObject match=null;for(int i=0;i<elements.length();i++)if(node.getTag().equals(elements.optJSONObject(i).optString("id")))match=elements.optJSONObject(i);specs.add(match);}
        modern=layout.json.optInt("version")==5;icons.clear();
        for(int i=0;i<nodes.size();i++){
            View child=((ViewGroup)nodes.get(i)).getChildAt(0);JSONObject spec=specs.get(i);if(spec==null)continue;
            try{android.graphics.drawable.Drawable icon=SvgIcon.drawable(activity,spec.optString("svg"),Color.parseColor(spec.optString("iconColor",spec.optString("color","#62776E"))));if(icon!=null)icons.put((String)nodes.get(i).getTag(),icon);}catch(Exception ignored){/* Metadata validation reports malformed SVG before apply. */}
            if(modern&&child instanceof TextView){((TextView)child).setSingleLine(true);((TextView)child).setEllipsize(android.text.TextUtils.TruncateAt.END);}
            if(modern)child.setBackground(child.isFocusable()?focusSurface(Color.parseColor(spec.optString("color","#62776E"))):new android.graphics.drawable.ColorDrawable(Color.TRANSPARENT));
        }
        // Background belongs to the scene, including its color, optional embedded image and bounds.
        View previous=findViewWithTag("scene-background");if(previous!=null)removeView(previous);
        JSONObject bg=page.optJSONObject("scene").optJSONObject("background");
        ImageView background=new ImageView(activity);background.setTag("scene-background");background.setBackgroundColor(Color.parseColor(bg.optString("color")));background.setScaleType(ImageView.ScaleType.CENTER_CROP);
        if(bg.has("image")){String image=bg.optString("image");byte[] bytes=Base64.decode(image.substring(image.indexOf(',')+1),Base64.NO_WRAP);background.setImageBitmap(BitmapFactory.decodeByteArray(bytes,0,bytes.length));}
        addView(background,0,new FrameLayout.LayoutParams(-1,-1));
        grid.setLayoutManager(new CatalogueGrid(activity,columns));
        rebuildCards();
        requestLayout();
    }
    private void rebuildCards() {
        for(AppAdapter.Holder holder:cards)removeView(holder.itemView);cards.clear();
        boundAdapter=(AppAdapter)grid.getAdapter();
        if(boundAdapter!=null)for(int i=0;i<boundAdapter.getItemCount();i++){AppAdapter.Holder holder=boundAdapter.sceneHolder(this,i);cards.add(holder);addView(holder.itemView);}
    }
    private void place(View view,JSONObject spec,float scale,int left,int top) {
        view.setVisibility(spec==null || !spec.optBoolean("visible",true)?GONE:VISIBLE);if(spec==null)return;
        JSONObject frame=spec.optJSONObject("frame");if(frame==null)return;
        int x=left+Math.round((float)frame.optDouble("x")*scale),y=top+Math.round((float)frame.optDouble("y")*scale);
        int width=Math.round((float)frame.optDouble("width")*scale),height=Math.round((float)frame.optDouble("height")*scale);
        view.setZ(spec.optInt("zIndex",1));view.measure(MeasureSpec.makeMeasureSpec(width,MeasureSpec.EXACTLY),MeasureSpec.makeMeasureSpec(height,MeasureSpec.EXACTLY));view.layout(x,y,x+width,y+height);
    }
    @Override protected void onLayout(boolean changed,int l,int t,int r,int b) {
        if(page==null){super.onLayout(changed,l,t,r,b);return;}
        float scale=Math.min(getWidth()/(float)designWidth,getHeight()/(float)designHeight);int left=Math.round((getWidth()-designWidth*scale)/2),top=Math.round((getHeight()-designHeight*scale)/2);
        grid.layout(0,0,getWidth(),getHeight());
        if(grid.getAdapter()!=boundAdapter)rebuildCards();
        layoutCards(scale,left,top);
        JSONObject bg=page.optJSONObject("scene").optJSONObject("background");place(findViewWithTag("scene-background"),bg,scale,left,top);
        for(int i=0;i<nodes.size();i++){
            View wrapper=nodes.get(i);place(wrapper,specs.get(i),scale,left,top);
            View child=((ViewGroup)wrapper).getChildAt(0);
            JSONObject spec=specs.get(i);
            if(spec!=null&&spec.has("backgroundColor"))wrapper.setBackgroundColor(UnifiedLayout.color(spec.optString("backgroundColor")));
            if(child instanceof TextView&&spec!=null&&spec.has("color"))((TextView)child).setTextColor(Color.parseColor(spec.optString("color")));
            String component=(String)wrapper.getTag();
            android.graphics.drawable.Drawable symbol=icons.get(component);
            if(modern&&child instanceof TextView){
                TextView text=(TextView)child;text.setCompoundDrawableTintList(null);
                boolean command=java.util.Arrays.asList("wallpaper","favourites","inputs","network","settings","backHome","allApps").contains(component);
                int padding=command?Math.round(8*basisScale()*scale):0;if(text.getPaddingLeft()!=padding||text.getPaddingRight()!=padding)text.setPadding(padding,0,padding,0);
                int iconSize=Math.round(Math.min(22*basisScale(),spec.optJSONObject("frame").optInt("height")*.5f)*scale);
                boolean resized=symbol!=null&&symbol.getBounds().width()!=iconSize;
                if(symbol!=null)symbol.setBounds(0,0,iconSize,iconSize);
                if(text.getCompoundDrawables()[0]!=symbol||resized){text.setCompoundDrawables(symbol,null,null,null);text.setCompoundDrawablePadding(Math.round(7*basisScale()*scale));}
            }
            if(child instanceof TextView&&spec!=null&&spec.has("text")&&!component.equals("clock")&&!component.equals("date"))((TextView)child).setText(spec.optString("text"));
            if(child.getId()==R.id.weatherLine&&spec!=null&&spec.has("color"))((TextView)child.findViewById(R.id.weatherText)).setTextColor(Color.parseColor(spec.optString("color")));
            if(child.getId()==R.id.weatherLine){
                ((TextView)child.findViewById(R.id.weatherText)).setTextSize(android.util.TypedValue.COMPLEX_UNIT_PX,13*basisScale()*scale);
                ImageView weatherIcon=child.findViewById(R.id.weatherIcon);
                if(modern){weatherIcon.setImageTintList(android.content.res.ColorStateList.valueOf(Color.parseColor(spec.optString("iconColor","#4F7465"))));if(symbol!=null)weatherIcon.setImageDrawable(symbol);}
                View image=weatherIcon;ViewGroup.LayoutParams ip=image.getLayoutParams();int size=Math.round(20*basisScale()*scale);if(ip.width!=size || ip.height!=size){ip.width=ip.height=size;image.setLayoutParams(ip);}
            }
            if(child instanceof TextView){String id=(String)wrapper.getTag();float size=id.equals("clock")?(modern?60:52):id.equals("title")?28:id.equals("allApps")?11:13;((TextView)child).setTextSize(android.util.TypedValue.COMPLEX_UNIT_PX,size*basisScale()*scale);}
        }
    }
    private float basisScale(){return Math.min(designWidth/960f,designHeight/540f);}
    String navigation(String direction){return navigation.optString(direction,"");}
    boolean edge(int position,boolean down){
        JSONArray items=page.optJSONArray("items");if(position<0||position>=items.length())return true;
        JSONObject current=frame(items.optJSONObject(position),position,columns,items.length(),section);double center=current.optDouble("y")+current.optDouble("height")/2;
        for(int i=0;i<items.length();i++){JSONObject n=items.optJSONObject(i);if(i==position||!n.optBoolean("visible",true))continue;JSONObject f=frame(n,i,columns,items.length(),section);double other=f.optDouble("y")+f.optDouble("height")/2;if(down?other>center+1:other<center-1)return false;}
        return true;
    }
    void release() {
        for(AppAdapter.Holder holder:cards)removeView(holder.itemView);cards.clear();
        ImageView background=findViewWithTag("scene-background");if(background!=null)background.setImageDrawable(null);
    }
    private static final class CatalogueGrid extends GridLayoutManager {
        CatalogueGrid(Activity activity,int columns){super(activity,columns);}
        @Override public void onLayoutChildren(RecyclerView.Recycler recycler,RecyclerView.State state){detachAndScrapAttachedViews(recycler);}
    }
    static JSONObject frame(JSONObject item,int index,int columns,int count,String section) {
        JSONObject explicit=item.optJSONObject("frame");if(explicit!=null)return explicit;
        // Documented fallback for newly added cards. Editor materializes these values before dragging.
        int width=(864/columns)-16,rows=Math.max(1,(int)Math.ceil((double)count/columns)),start=section.equals("home") && rows==1?326:128,step=(int)Math.min(174,348/rows);
        try{return new JSONObject().put("x",48+(index%columns)*(864/columns)).put("y",start+(index/columns)*step).put("width",width).put("height",Math.max(1,Math.min(150,step-16))) ;}catch(Exception impossible){throw new IllegalStateException(impossible);}
    }
    static RecyclerView.ViewHolder holder(RecyclerView grid,int position) {
        if(grid.getParent() instanceof LayoutScene){LayoutScene scene=(LayoutScene)grid.getParent();return position>=0 && position<scene.cards.size()?scene.cards.get(position):null;}
        return grid.findViewHolderForAdapterPosition(position);
    }
    private void layoutCards(float scale,int left,int top) {
        JSONArray items=page.optJSONArray("items");
        for(int i=0;i<cards.size();i++) {
            JSONObject item=items.optJSONObject(i);View view=cards.get(i).itemView;
            JSONObject frame=frame(item,i,columns,items.length(),section);
            try{JSONObject spec=new JSONObject(item.toString());spec.put("frame",frame);place(view,spec,scale,left,top);}catch(Exception impossible){throw new IllegalStateException(impossible);}
            int w=Math.round(frame.optInt("width")*scale),h=Math.round(frame.optInt("height")*scale);view.setPadding(0,0,0,0);
            View card=view.findViewById(R.id.card);TextView name=view.findViewById(R.id.name);ImageView icon=view.findViewById(R.id.icon);
            FrameLayout.LayoutParams cp=(FrameLayout.LayoutParams)card.getLayoutParams();int cardHeight=Math.max(1,Math.round(h*110f/150));if(cp.width!=w || cp.height!=cardHeight || cp.gravity!=android.view.Gravity.TOP){cp.width=w;cp.height=cardHeight;cp.gravity=android.view.Gravity.TOP;card.setLayoutParams(cp);}
            FrameLayout.LayoutParams np=(FrameLayout.LayoutParams)name.getLayoutParams();int labelHeight=Math.max(1,Math.round(h*26f/150)),labelTop=Math.round(h*118f/150);if(np.width!=w || np.height!=labelHeight || np.topMargin!=labelTop){np.width=w;np.height=labelHeight;np.topMargin=labelTop;name.setLayoutParams(np);}name.setTextSize(android.util.TypedValue.COMPLEX_UNIT_PX,Math.min(14*basisScale(),h/scale*14f/150)*scale);
            ViewGroup.LayoutParams ip=icon.getLayoutParams();int iconSize=Math.max(1,Math.round(Math.min(modern?52*basisScale():38*basisScale(),h/scale*.3f)*scale));if(ip.width!=iconSize || ip.height!=iconSize){ip.width=ip.height=iconSize;icon.setLayoutParams(ip);}
            view.measure(MeasureSpec.makeMeasureSpec(w,MeasureSpec.EXACTLY),MeasureSpec.makeMeasureSpec(h,MeasureSpec.EXACTLY));view.layout(view.getLeft(),view.getTop(),view.getLeft()+w,view.getTop()+h);
        }
    }
}
