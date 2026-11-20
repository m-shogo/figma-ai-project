import dotenv from 'dotenv';
import FullReload from 'vite-plugin-full-reload';
import vitePluginWatchAndConvert from './vite-plugins/watch-and-convert.mjs';

// プロジェクト直下の .env から VITE_DEV_SITE_HOST（ローカル WP のホスト名）を読む
dotenv.config();

/**
 * 正規表現用にホスト名のメタ文字をエスケープする
 * @param {string} hostString
 * @returns {string}
 */
function escapeRegExp(hostString) {
    return hostString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 例: local.wp（protocol なし）。.env の VITE_DEV_SITE_HOST で上書き可能
const devSiteHost = (process.env.VITE_DEV_SITE_HOST || 'local.wp').trim();

const devSiteOriginPattern = devSiteHost
    ? new RegExp(`^https?:\\/\\/${escapeRegExp(devSiteHost)}(?::\\d+)?$`)
    : null;

const defaultLocalhostOriginPattern =
    /^https?:\/\/(?:(?:[^:]+\.)?localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;

const corsOriginList = [defaultLocalhostOriginPattern];
if (devSiteOriginPattern) {
    corsOriginList.push(devSiteOriginPattern);
}

const allowedHostsList = [devSiteHost];

export default {
    plugins: [
        // ファイルの変更を検知してフルリロード（※Viteクライアントに接続しているページでのみ有効）
        FullReload(['theme/**/*.php', 'theme/**/*.css', 'theme/**/*.js']),
        vitePluginWatchAndConvert(),
    ],
    server: {
        // npm の `vite --host` と同様: 全インターフェースでリッスン
        host: true,
        strictPort: true,
        // VITE_DEV_SITE_HOST で WordPress を開いているときの Origin を CORS で許可する
        cors: {
            origin: corsOriginList,
        },
        allowedHosts: allowedHostsList.length > 0 ? allowedHostsList : undefined,
        // ページがカスタムドメインでも WebSocket は Vite（localhost:5173）へ向ける
        hmr: {
            host: 'localhost',
        },
    },
};
