package com.ecojust.puretv;

import android.view.View;
import androidx.recyclerview.widget.RecyclerView;

/** Focus an adapter position after its holder has actually attached, including a cold launch. */
final class CardFocus {
    private CardFocus() { }

    static void request(RecyclerView grid, int position) {
        if (grid.getAdapter() == null || grid.getAdapter().getItemCount() == 0) return;
        int target = Math.max(0, Math.min(position, grid.getAdapter().getItemCount() - 1));
        RecyclerView.ViewHolder holder = LayoutScene.holder(grid,target);
        if (holder != null) {
            if(holder.itemView.getVisibility()==View.VISIBLE) {
                View card=holder.itemView.findViewById(R.id.card);
                if(card.getWidth()>0)card.requestFocus();
                else holder.itemView.addOnLayoutChangeListener(new View.OnLayoutChangeListener(){
                    @Override public void onLayoutChange(View view,int l,int t,int r,int b,int oldL,int oldT,int oldR,int oldB){if(card.getWidth()>0){view.removeOnLayoutChangeListener(this);card.requestFocus();}}
                });
            }
            else if(grid.getParent() instanceof LayoutScene){
                android.view.ViewGroup parent=(android.view.ViewGroup)grid.getParent();for(int i=0;i<parent.getChildCount();i++)if(parent.getChildAt(i).isShown() && parent.getChildAt(i).hasFocusable()){parent.getChildAt(i).requestFocus();break;}
            }
            return;
        }
        RecyclerView.OnChildAttachStateChangeListener listener = new RecyclerView.OnChildAttachStateChangeListener() {
            @Override public void onChildViewAttachedToWindow(View view) {
                if (grid.getChildAdapterPosition(view) != target) return;
                grid.removeOnChildAttachStateChangeListener(this);
                view.post(() -> view.findViewById(R.id.card).requestFocus());
            }
            @Override public void onChildViewDetachedFromWindow(View view) { }
        };
        grid.addOnChildAttachStateChangeListener(listener);
        grid.scrollToPosition(target);
    }
}
