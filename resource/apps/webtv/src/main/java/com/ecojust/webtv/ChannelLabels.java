package com.ecojust.webtv;

import android.content.Context;

/** Localize built-in channel names at display time; imported names and IDs stay intact. */
final class ChannelLabels {
    static String name(Context context, Playlist.Channel channel, boolean builtIn) {
        if (!builtIn) return channel.name;
        int label;
        switch (channel.id) {
            case "GuangdongSatelliteTV.cn": label = R.string.channel_guangdong; break;
            case "HunanTV.cn": label = R.string.channel_hunan; break;
            case "BeijingSatelliteTV.cn": label = R.string.channel_beijing; break;
            case "ZhejiangSatelliteTV.cn": label = R.string.channel_zhejiang; break;
            case "JiangsuSatelliteTV.cn": label = R.string.channel_jiangsu; break;
            case "DragonTVInternational.cn": label = R.string.channel_dragon; break;
            case "ShenzhenSatelliteTV.cn": label = R.string.channel_shenzhen; break;
            case "AnhuiTV.cn": label = R.string.channel_anhui; break;
            case "ShandongSatelliteTV.cn": label = R.string.channel_shandong; break;
            case "SichuanSatelliteTV.cn": label = R.string.channel_sichuan; break;
            case "TianjinTV.cn": label = R.string.channel_tianjin; break;
            case "LiaoningTV.cn": label = R.string.channel_liaoning; break;
            case "HeilongjiangTV.cn": label = R.string.channel_heilongjiang; break;
            case "HebeiTV.cn": label = R.string.channel_hebei; break;
            case "JiangxiTV.cn": label = R.string.channel_jiangxi; break;
            case "GuizhouTV.cn": label = R.string.channel_guizhou; break;
            case "QinghaiTV.cn": label = R.string.channel_qinghai; break;
            case "YunnanSatelliteTV.cn": label = R.string.channel_yunnan; break;
            case "NingxiaSatelliteChannel.cn": label = R.string.channel_ningxia; break;
            case "YanbianSatelliteTV.cn": label = R.string.channel_yanbian; break;
            case "BingtuanSatelliteTV.cn": label = R.string.channel_bingtuan; break;
            case "ShandongTV.cn": label = R.string.channel_shandong; break;
            default: return channel.name;
        }
        return context.getString(label);
    }
    private ChannelLabels() { }
}
