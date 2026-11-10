package com.ecojust.operatv;

import android.app.Activity;
import android.app.Dialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.Locale;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.Callable;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/** Independent TV library; network content is only shown after a successful provider response. */
public class MainActivity extends Activity {
    private static final int PICK_DOCUMENT=52;
    private final Handler handler=new Handler(Looper.getMainLooper());
    private final ThreadPoolExecutor worker=new ThreadPoolExecutor(2,2,20,TimeUnit.SECONDS,new ArrayBlockingQueue<Runnable>(4),new ThreadPoolExecutor.AbortPolicy());
    private final List<OperaItem> records=new ArrayList<>();
    private CctvCatalog catalog;
    private OperaStore store;
    private LinearLayout root,nav,content,columnStrip;
    private TextView heading,subtitle,count;
    private EditText search;
    private ScrollView scroll;
    private Button previous,next;
    private Dialog modal;
    private Future<?> pending;
    private int generation,pageNumber=1;
    private String screen="featured",columnId="",filter="",returnFocus="";
    private boolean active,destroyed,firstResume=true,loading,hasMore,resumeLoad;
    private Uri pendingDocument;

    protected CctvCatalog createCatalog(){return new CctvCatalog();}
    protected OperaStore createStore(){return new OperaStore(this);}
    private String tr(String zh,String en){return Ui.tr(this,zh,en);}
    private int dp(float value){return Ui.dp(this,value);}
    private TextView text(String value,int size,int color){return Ui.text(this,value,size,color);}
    private Button button(String title,String key,View.OnClickListener click){return Ui.button(this,title,key,click);}
    private LinearLayout row(){return Ui.row(this);}
    private LinearLayout column(){return Ui.column(this);}
    private boolean remote(){return "featured".equals(screen)||"columns".equals(screen);}

    @Override public void onCreate(Bundle saved){
        super.onCreate(saved);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,WindowManager.LayoutParams.FLAG_FULLSCREEN);
        catalog=createCatalog();store=createStore();columnId=CctvCatalog.columns().get(0).id;
        if(saved!=null){screen=saved.getString("screen","featured");columnId=saved.getString("column",columnId);filter=saved.getString("filter","");pageNumber=Math.max(1,saved.getInt("page",1));}
        createShell();
    }
    private void createShell(){
        root=column();root.setBackgroundColor(Ui.BG);root.setPadding(dp(22),dp(16),dp(22),dp(12));setContentView(root);
        LinearLayout mast=row();TextView brand=text(tr("梨园 TV","Opera TV"),28,Ui.GOLD);brand.setTypeface(null,Typeface.BOLD);mast.addView(brand,new LinearLayout.LayoutParams(0,dp(43),1));
        TextView mark=text(tr("一方戏台 · 慢慢听","A stage for every story"),13,Ui.MUTED);mast.addView(mark);root.addView(mast);
        LinearLayout body=row();body.setGravity(Gravity.TOP);LinearLayout.LayoutParams bodyLp=new LinearLayout.LayoutParams(-1,0,1);bodyLp.topMargin=dp(12);root.addView(body,bodyLp);
        nav=column();nav.setPadding(0,0,dp(18),0);body.addView(nav,new LinearLayout.LayoutParams(dp(155),-1));
        for(String id:new String[]{"featured","columns","favorites","history","mine"}){Button b=button(screenTitle(id),"nav-"+id,v->navigate(id));b.setGravity(Gravity.CENTER_VERTICAL|Gravity.LEFT);LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,dp(48));lp.bottomMargin=dp(9);nav.addView(b,lp);}
        View spacer=new View(this);nav.addView(spacer,new LinearLayout.LayoutParams(1,0,1));
        TextView local=text(tr("收藏与续播\n只保存在本机","Favorites & progress\nstay on this device"),11,Ui.MUTED);local.setLineSpacing(dp(4),1);nav.addView(local);
        LinearLayout main=column();body.addView(main,new LinearLayout.LayoutParams(0,-1,1));
        LinearLayout titleRow=row();heading=text("",23,Ui.TEXT);heading.setTypeface(null,Typeface.BOLD);titleRow.addView(heading,new LinearLayout.LayoutParams(0,dp(35),1));
        Button imports=button(tr("＋ 导入","＋ Import"),"import-menu",v->importMenu());titleRow.addView(imports,new LinearLayout.LayoutParams(dp(122),dp(40)));main.addView(titleRow);
        subtitle=text("",12,Ui.MUTED);subtitle.setPadding(0,dp(4),0,dp(9));main.addView(subtitle,new LinearLayout.LayoutParams(-1,-2));
        columnStrip=row();columnStrip.setPadding(0,0,0,dp(8));main.addView(columnStrip,new LinearLayout.LayoutParams(-1,-2));
        LinearLayout find=row();search=new EditText(this);search.setTag("search-input");search.setContentDescription("search-input");search.setSingleLine(true);search.setTextSize(15);search.setTextColor(Ui.TEXT);search.setHintTextColor(Ui.MUTED);search.setPadding(dp(12),0,dp(12),0);search.setBackground(Ui.shape(this,Ui.PANEL,Ui.LINE,1));search.setHint(tr("筛选当前已加载节目","Filter currently loaded titles"));search.setImeOptions(EditorInfo.IME_ACTION_DONE);search.setInputType(android.text.InputType.TYPE_CLASS_TEXT);search.setText(filter);find.addView(search,new LinearLayout.LayoutParams(0,dp(40),1));
        Button clear=button(tr("清除","Clear"),"search-clear",v->search.setText(""));LinearLayout.LayoutParams clearLp=new LinearLayout.LayoutParams(dp(80),dp(40));clearLp.leftMargin=dp(8);find.addView(clear,clearLp);main.addView(find);
        search.addTextChangedListener(new TextWatcher(){public void beforeTextChanged(CharSequence s,int start,int n,int after){}public void onTextChanged(CharSequence s,int start,int before,int n){filter=s.toString();if(!loading)renderRecords();}public void afterTextChanged(Editable e){}});
        count=text("",11,Ui.MUTED);count.setPadding(0,dp(9),0,dp(8));main.addView(count);
        scroll=new ScrollView(this);scroll.setFillViewport(true);content=column();content.setPadding(dp(3),dp(3),dp(3),dp(3));scroll.addView(content,new ScrollView.LayoutParams(-1,-2));main.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        LinearLayout paging=row();paging.setPadding(0,dp(7),0,0);previous=button(tr("上一页","Previous"),"page-previous",v->loadPage(pageNumber-1));next=button(tr("下一页","Next"),"page-next",v->loadPage(pageNumber+1));paging.addView(previous,new LinearLayout.LayoutParams(dp(110),dp(37)));TextView gap=text(tr("方向键移动 · 确定选择","Arrows to move · OK to select"),11,Ui.MUTED);gap.setGravity(Gravity.CENTER);paging.addView(gap,new LinearLayout.LayoutParams(0,dp(37),1));paging.addView(next,new LinearLayout.LayoutParams(dp(110),dp(37)));main.addView(paging);
        updateHeader();
    }
    private String screenTitle(String id){switch(id){case "columns":return tr("戏曲栏目","Programs");case "favorites":return tr("我的收藏","Favorites");case "history":return tr("最近观看","Recent");case "mine":return tr("我的片单","My library");default:return tr("今日戏台","On stage");}}
    private String columnTitle(){for(CctvCatalog.Column c:CctvCatalog.columns())if(c.id.equals(columnId))return tr(c.title,c.titleEn);return tr("戏曲节目","Opera programs");}
    private void updateHeader(){
        heading.setText(screenTitle(screen));subtitle.setText(remote()?tr("央视网公开点播 · ","Public CCTV programs · ")+columnTitle():"mine".equals(screen)?tr("视频链接、播放列表与本机文件","Your links, playlists and local videos"):"history".equals(screen)?tr("从上次听到的地方继续","Pick up where you left off"):tr("把喜欢的唱段留在这里","Keep the performances you love"));
        for(int i=0;i<nav.getChildCount();i++){View b=nav.getChildAt(i);if(b instanceof Button)b.setBackground(Ui.focus(this,("nav-"+screen).equals(b.getTag())));}
        columnStrip.removeAllViews();columnStrip.setVisibility(remote()?View.VISIBLE:View.GONE);
        if(remote()){Button choose=button(columnTitle()+"  ▾","choose-column",v->chooseColumn());columnStrip.addView(choose,new LinearLayout.LayoutParams(0,dp(36),1));Button refresh=button(tr("刷新","Refresh"),"refresh",v->loadPage(pageNumber));LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(dp(95),dp(36));lp.leftMargin=dp(9);columnStrip.addView(refresh,lp);}
        previous.setVisibility(remote()?View.VISIBLE:View.GONE);next.setVisibility(remote()?View.VISIBLE:View.GONE);
        previous.setEnabled(remote()&&!loading&&pageNumber>1);next.setEnabled(remote()&&!loading&&hasMore);
    }
    private void navigate(String value){
        closeModal();cancelPending();screen=value;pageNumber=1;filter="";search.setText("");returnFocus="";records.clear();scroll.scrollTo(0,0);
        if(remote())loadPage(1);else loadLocal();
    }
    private void loadPage(int page){
        if(page<1)return;pageNumber=page;loading=true;records.clear();hasMore=false;updateHeader();showMessage(tr("正在请戏登台…","Loading the stage…"),tr("正在读取公开节目目录","Reading the public program list"),null);count.setText(tr("读取中","Loading"));
        final String requested=columnId;request(()->catalog.load(requested,page),result->{loading=false;records.clear();records.addAll(result.items);hasMore=result.hasMore;updateHeader();renderRecords();},error->{loading=false;hasMore=false;updateHeader();count.setText(tr("节目暂时未加载","Programs could not be loaded"));showMessage(tr("这次没能接通戏台","The stage is temporarily unavailable"),message(error),()->loadPage(page));});
    }
    private void loadLocal(){
        loading=false;hasMore=false;records.clear();if("favorites".equals(screen))records.addAll(store.favorites());else if("history".equals(screen))records.addAll(store.history());else records.addAll(store.imported());updateHeader();renderRecords();
    }
    private void renderRecords(){
        if(content==null)return;content.removeAllViews();String query=filter.trim().toLowerCase(Locale.ROOT);List<OperaItem> visible=new ArrayList<>();
        for(OperaItem item:records)if(query.isEmpty()||(item.title+" "+item.group).toLowerCase(Locale.ROOT).contains(query))visible.add(item);
        count.setText((remote()?tr("第 ","Page ")+pageNumber+tr(" 页 · "," · "):"")+visible.size()+tr(" 个节目"," titles")+(!query.isEmpty()?tr(" · 当前页筛选"," · filtered on this page"):""));
        if(!remote()&&!store.problem().isEmpty()){showMessage(tr("本机资料暂时无法读取","Local library cannot be read"),store.problem(),()->loadLocal());return;}
        if(visible.isEmpty()){showMessage(!query.isEmpty()?tr("没有匹配的节目","No matching titles"):tr("这里还没有节目","Nothing here yet"),!query.isEmpty()?tr("试试其他关键词，或清除筛选。","Try another keyword or clear the filter."):"mine".equals(screen)?tr("导入视频链接、M3U / JSON 片单，或选择自己的视频。","Import a video link, an M3U / JSON playlist, or choose your own video."):"favorites".equals(screen)?tr("在节目详情中选择收藏，就能在这里找到。","Save a title from its details to find it here."):"history".equals(screen)?tr("实际播放后，会在这里保存续播进度。","Progress appears here after playback begins."):tr("栏目暂时没有返回节目，可尝试其他栏目。","This program returned no titles. Try another program."),null);if("mine".equals(screen)){Button add=button(tr("导入我的片单","Import my library"),"empty-import",v->importMenu());content.addView(add,new LinearLayout.LayoutParams(-2,dp(44)));}return;}
        Set<String> favoriteIds=new HashSet<>();for(OperaItem saved:store.favorites())favoriteIds.add(saved.id);
        int columns=getResources().getConfiguration().screenWidthDp>=1100?3:2;
        LinearLayout line=null;
        for(int i=0;i<visible.size();i++){
            if(i%columns==0){line=row();line.setGravity(Gravity.TOP);content.addView(line,new LinearLayout.LayoutParams(-1,-2));}
            OperaItem item=visible.get(i);Button card=button((favoriteIds.contains(item.id)?"★  ":"")+item.title+"\n"+(item.group.isEmpty()?tr("我的片单","My library"):item.group),"card:"+item.id,v->detail(item));card.setGravity(Gravity.TOP|Gravity.LEFT);card.setTextSize(17);card.setTypeface(null,Typeface.NORMAL);card.setMaxLines(4);card.setEllipsize(TextUtils.TruncateAt.END);card.setPadding(dp(17),dp(19),dp(17),dp(14));card.setBackground(Ui.focus(this,false));
            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,dp(135),1);lp.bottomMargin=dp(12);if(i%columns!=columns-1)lp.rightMargin=dp(12);line.addView(card,lp);
        }
        if(visible.size()%columns!=0)for(int i=visible.size()%columns;i<columns;i++){View gap=new View(this);line.addView(gap,new LinearLayout.LayoutParams(0,1,1));}
        restoreFocus();
    }
    private void showMessage(String title,String explanation,Runnable retry){
        content.removeAllViews();TextView big=text(title,23,Ui.GOLD);big.setTypeface(null,Typeface.BOLD);big.setPadding(dp(14),dp(23),dp(14),dp(10));content.addView(big);
        TextView hint=text(explanation,15,Ui.MUTED);hint.setPadding(dp(14),0,dp(14),dp(18));hint.setMaxLines(5);hint.setEllipsize(TextUtils.TruncateAt.END);content.addView(hint);
        if(retry!=null){Button again=button(tr("重试","Retry"),"retry",v->retry.run());content.addView(again,new LinearLayout.LayoutParams(dp(125),dp(42)));}
    }
    private void chooseColumn(){LinearLayout box=dialogBody(tr("选一个戏曲栏目","Choose a program"));for(CctvCatalog.Column c:CctvCatalog.columns()){Button b=button(tr(c.title,c.titleEn),"column:"+c.id,v->{closeModal();columnId=c.id;screen="columns";search.setText("");loadPage(1);});addDialogButton(box,b);}addDialogButton(box,button(tr("取消","Cancel"),"dialog-cancel",v->closeModal()));}
    private void detail(OperaItem item){
        returnFocus="card:"+item.id;LinearLayout box=dialogBody(item.title);TextView source=text("cctv".equals(item.kind)?tr("央视网公开节目","Public CCTV program"):"document".equals(item.kind)?tr("自己的本机视频","Your local video"):tr("自己导入的视频链接","Your imported video link"),13,Ui.MUTED);source.setPadding(0,dp(4),0,dp(12));box.addView(source);
        Button play=button(store.position(item.id)>0?tr("继续播放","Continue watching"):tr("开始播放","Play"),"detail-play",v->openPlayer(item));addDialogButton(box,play);
        Button favorite=button(store.isFavorite(item.id)?tr("取消收藏","Remove favorite"):tr("收藏节目","Save favorite"),"detail-favorite",v->{try{store.toggleFavorite(item);closeModal();if(!remote())loadLocal();else renderRecords();}catch(IOException e){toast(message(e));}});addDialogButton(box,favorite);
        if("mine".equals(screen))addDialogButton(box,button(tr("从片单移除","Remove from library"),"detail-remove",v->confirmRemove(item)));
        addDialogButton(box,button(tr("返回","Back"),"dialog-cancel",v->closeModal()));play.requestFocus();
    }
    protected void openPlayer(OperaItem item){try{closeModal();Intent intent=new Intent();intent.setClassName(this,"com.ecojust.operatv.PlaybackActivity");intent.putExtra("item",item.toJson().toString());startActivity(intent);}catch(Exception e){toast(tr("暂时无法打开播放器：","Unable to open player: ")+message(e));}}
    private void confirmRemove(OperaItem item){LinearLayout box=dialogBody(tr("从片单移除？","Remove from your library?"));box.addView(text(tr("不会删除原始视频文件。","The original video file will remain."),15,Ui.MUTED));addDialogButton(box,button(tr("移除","Remove"),"remove-confirm",v->{try{store.removeImported(item.id);closeModal();loadLocal();}catch(IOException e){toast(message(e));}}));addDialogButton(box,button(tr("取消","Cancel"),"dialog-cancel",v->closeModal()));}
    private void importMenu(){LinearLayout box=dialogBody(tr("把喜欢的戏带进来","Bring your favorites along"));box.addView(text(tr("支持视频链接、M3U / JSON 片单和本机视频。","Add video links, M3U / JSON playlists or local videos."),14,Ui.MUTED));addDialogButton(box,button(tr("添加视频链接","Add video link"),"import-direct",v->importForm(false)));addDialogButton(box,button(tr("导入播放列表链接","Import playlist URL"),"import-playlist",v->importForm(true)));addDialogButton(box,button(tr("选择视频或片单文件","Choose video or playlist file"),"import-file",v->chooseFile()));addDialogButton(box,button(tr("取消","Cancel"),"dialog-cancel",v->closeModal()));}
    private EditText field(LinearLayout box,String hint,String key){EditText input=new EditText(this);input.setSingleLine(true);input.setTextSize(16);input.setTextColor(Ui.TEXT);input.setHintTextColor(Ui.MUTED);input.setHint(hint);input.setTag(key);input.setContentDescription(key);input.setPadding(dp(12),0,dp(12),0);input.setBackground(Ui.shape(this,Ui.BG,Ui.LINE,1));LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,dp(44));lp.topMargin=dp(10);box.addView(input,lp);return input;}
    private void importForm(boolean playlist){
        LinearLayout box=dialogBody(playlist?tr("导入播放列表","Import a playlist"):tr("添加视频链接","Add a video link"));
        EditText title=playlist?null:field(box,tr("节目名称","Title"),"import-title");EditText url=field(box,playlist?tr("M3U / JSON 的 http(s) 地址","HTTP(S) URL of an M3U / JSON playlist"):tr("视频或 HLS 的 http(s) 地址","HTTP(S) video or HLS URL"),"import-url");url.setInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_VARIATION_URI);
        TextView status=text(tr("只添加你希望播放的地址。","Add an address you intend to play."),12,Ui.MUTED);status.setPadding(0,dp(9),0,dp(5));box.addView(status);
        Button confirm=button(tr("添加到我的片单","Add to my library"),"import-confirm",v->{String address=url.getText().toString().trim();String name=title==null?"":title.getText().toString().trim();if(address.isEmpty()||(!playlist&&name.isEmpty())){status.setText(tr("请填写名称与地址。","Enter the title and address."));return;}url.setEnabled(false);if(title!=null)title.setEnabled(false);View b=box.findViewWithTag("import-confirm");b.setEnabled(false);status.setText(tr("正在读取并检查…","Reading and checking…"));request(()->playlist?OperaImporter.fromUrl(address):Collections.singletonList(OperaItem.direct(name,OperaItem.networkUri(address),tr("我的片单","My library"))),items->{try{int imported=store.importItems(items);closeModal();navigate("mine");if(!items.isEmpty()){returnFocus="card:"+items.get(0).id;restoreFocus();}toast(tr("已保存 ","Saved ")+imported+tr(" 个节目"," titles"));}catch(IOException e){status.setText(message(e));url.setEnabled(true);if(title!=null)title.setEnabled(true);b.setEnabled(true);}},e->{status.setText(message(e));url.setEnabled(true);if(title!=null)title.setEnabled(true);b.setEnabled(true);});});addDialogButton(box,confirm);addDialogButton(box,button(tr("取消","Cancel"),"dialog-cancel",v->closeModal()));if(title!=null)title.requestFocus();else url.requestFocus();
    }
    private void chooseFile(){
        closeModal();Intent pick=new Intent(Intent.ACTION_OPEN_DOCUMENT);pick.addCategory(Intent.CATEGORY_OPENABLE);pick.setType("*/*");pick.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        try{startActivityForResult(pick,PICK_DOCUMENT);}catch(ActivityNotFoundException e){toast(tr("设备没有文件选择器，请使用视频或片单链接。","No file picker is available. Use a video or playlist URL."));importMenu();}
    }
    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){super.onActivityResult(requestCode,resultCode,data);if(requestCode!=PICK_DOCUMENT||resultCode!=RESULT_OK||data==null||data.getData()==null)return;Uri uri=data.getData();if(!"content".equals(uri.getScheme())){toast(tr("请选择设备文件提供器中的文件。","Choose a file from a document provider."));return;}try{getContentResolver().takePersistableUriPermission(uri,Intent.FLAG_GRANT_READ_URI_PERMISSION);pendingDocument=uri;if(active)importDocument();}catch(SecurityException e){toast(tr("无法保留文件读取权限，请换用支持长期访问的文件提供器。","This provider could not retain read access. Choose another provider."));}}
    private void importDocument(){final Uri uri=pendingDocument;pendingDocument=null;if(uri==null)return;LinearLayout box=dialogBody(tr("导入文件","Import file"));TextView status=text(tr("正在读取文件…","Reading file…"),16,Ui.MUTED);box.addView(status);addDialogButton(box,button(tr("取消","Cancel"),"dialog-cancel",v->closeModal()));request(()->OperaImporter.fromDocument(this,uri),items->{try{int n=store.importItems(items);closeModal();navigate("mine");if(!items.isEmpty()){returnFocus="card:"+items.get(0).id;restoreFocus();}toast(tr("已保存 ","Saved ")+n+tr(" 个节目"," titles"));}catch(IOException e){status.setText(message(e));}},e->status.setText(message(e)));}
    private LinearLayout dialogBody(String title){
        closeModal();if(loading){cancelPending();loading=false;updateHeader();count.setText(tr("读取已暂停","Loading paused"));showMessage(tr("节目读取已暂停","Program loading paused"),tr("关闭窗口后可重试读取。","Retry loading after closing this window."),()->loadPage(pageNumber));}modal=new Dialog(this);modal.requestWindowFeature(Window.FEATURE_NO_TITLE);ScrollView scroller=new ScrollView(this);LinearLayout box=column();box.setPadding(dp(24),dp(20),dp(24),dp(20));box.setBackground(Ui.shape(this,Ui.PANEL,Ui.LINE,1));scroller.addView(box);TextView heading=text(title,22,Ui.GOLD);heading.setTypeface(null,Typeface.BOLD);heading.setMaxLines(3);heading.setEllipsize(TextUtils.TruncateAt.END);box.addView(heading);modal.setContentView(scroller);modal.setOnCancelListener(d->closeModal());modal.show();Window w=modal.getWindow();if(w!=null){w.setBackgroundDrawableResource(android.R.color.transparent);w.setLayout(Math.min(getResources().getDisplayMetrics().widthPixels-dp(44),dp(600)),Math.min(getResources().getDisplayMetrics().heightPixels-dp(36),dp(470)));w.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);}return box;
    }
    private void addDialogButton(LinearLayout box,Button button){LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,dp(44));lp.topMargin=dp(10);box.addView(button,lp);}
    private void closeModal(){if(modal!=null){Dialog old=modal;modal=null;View focused=old.getCurrentFocus();if(focused!=null){InputMethodManager ime=(InputMethodManager)getSystemService(INPUT_METHOD_SERVICE);if(ime!=null)ime.hideSoftInputFromWindow(focused.getWindowToken(),0);}old.setOnCancelListener(null);old.dismiss();cancelPending();restoreFocus();}}
    private void restoreFocus(){if(!returnFocus.isEmpty()){final String key=returnFocus;root.post(()->{if(destroyed)return;View v=root.findViewWithTag(key);if(v!=null)v.requestFocus();});}}
    private String message(Throwable error){String value=error.getMessage();if(value==null||value.trim().isEmpty())value=tr("暂时无法完成，请检查连接后重试。","Unable to complete. Check your connection and retry.");return value.length()>280?value.substring(0,280):value;}
    private void toast(String value){Toast.makeText(this,value,Toast.LENGTH_LONG).show();}
    private interface Result<T>{void accept(T value);}
    private void cancelPending(){generation++;if(pending!=null)pending.cancel(true);pending=null;}
    private <T> void request(Callable<T> call,Result<T> success,Result<Exception> failure){
        cancelPending();final int token=generation;
        try{pending=worker.submit(()->{try{T value=call.call();handler.post(()->{if(destroyed||!active||token!=generation)return;pending=null;success.accept(value);});}catch(Exception e){handler.post(()->{if(destroyed||!active||token!=generation)return;pending=null;failure.accept(e);});}});}catch(java.util.concurrent.RejectedExecutionException e){pending=null;failure.accept(new IOException(tr("上一项操作仍在结束，请稍后重试。","The previous operation is finishing. Please retry shortly.")));}
    }
    @Override protected void onResume(){super.onResume();active=true;if(firstResume){firstResume=false;if(remote())loadPage(pageNumber);else loadLocal();root.findViewWithTag("nav-"+screen).requestFocus();}else if(resumeLoad){resumeLoad=false;if(remote())loadPage(pageNumber);else loadLocal();}else if(!remote())loadLocal();if(pendingDocument!=null)importDocument();restoreFocus();}
    @Override protected void onPause(){active=false;resumeLoad=loading;loading=false;View focused=root.findFocus();if(focused!=null&&focused.getTag() instanceof String)returnFocus=(String)focused.getTag();cancelPending();closeModal();super.onPause();}
    @Override protected void onDestroy(){destroyed=true;cancelPending();closeModal();handler.removeCallbacksAndMessages(null);worker.shutdownNow();super.onDestroy();}
    @Override protected void onSaveInstanceState(Bundle out){super.onSaveInstanceState(out);out.putString("screen",screen);out.putString("column",columnId);out.putString("filter",filter);out.putInt("page",pageNumber);}
    @Override public void onBackPressed(){if(modal!=null){closeModal();return;}if(!filter.isEmpty()){search.setText("");return;}if(!"featured".equals(screen)){navigate("featured");return;}super.onBackPressed();}
}
