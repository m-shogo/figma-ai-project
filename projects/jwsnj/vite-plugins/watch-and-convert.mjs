import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import { globSync } from 'glob';
import dotenv from 'dotenv';

// AVIF変換を行うかどうか
dotenv.config({ path: ['.env', 'runtime.env'], quiet: true });
const VITE_AVIF_CONVERSION = process.env.VITE_AVIF_CONVERSION || true;
const WP_PORT = process.env.WP_PORT || '8888';

// ホストのローカルIPアドレスを取得
const getLocalIpAddress = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
};

// 共通の定数
const CONVERT_PATTERN = '**/*.{png,jpg,jpeg}';
const COPY_PATTERN = '**/*.{svg,gif,webp,avif,ico,webmanifest}';
const SRC_DIR = path.resolve(process.cwd(), 'src/images');
const OUT_DIR = path.resolve(process.cwd(), 'theme/images');
// WebP/AVIF変換をスキップしてそのままコピーするディレクトリ（src/images からの相対パス）
const SKIP_CONVERT_DIRS = ['favicon'];

// 圧縮率設定（SVG・GIFは将来の圧縮用にオプションを用意）
const config = {
    build: {
        jpgOptions: { quality: 90 },
        pngOptions: { quality: 90 },
        webpOptions: { quality: 90 },
        avifOptions: { quality: 70 },
        svgOptions: { compress: false },
        gifOptions: { compress: false },
    },
    serve: {
        webpOptions: { quality: 50 },
        avifOptions: { quality: 50 },
        svgOptions: { compress: false },
        gifOptions: { compress: false },
    },
};

// メモリ使用量を制限するための設定
const BATCH_SIZE = 5; // 同時に処理する画像数を制限
const PROCESS_INTERVAL = 100; // 処理間隔（ミリ秒）

// ファイル名がコピーファイルかどうかを判定する関数
const isCopyFile = (filename) => {
    const basename = path.basename(filename);
    return / copy|\scopy|\sコピー/.test(basename);
};

/**
 * favicon 配下など、WebP/AVIF変換をスキップするファイルかどうかを判定する
 * @param {string} filePath - 判定するファイルのパス
 * @returns {boolean}
 */
const isSkipConvertFile = (filePath) => {
    const relativePath = path.relative(SRC_DIR, filePath);
    const topDir = relativePath.split(path.sep)[0];
    return SKIP_CONVERT_DIRS.includes(topDir);
};

// 画像ファイルを検索する関数（favicon 配下は変換対象から除外）
const findImageFiles = (dir, pattern = CONVERT_PATTERN) => {
    if (!fs.existsSync(dir)) return [];

    return globSync(`${dir}/${pattern}`, {
        ignore: ['**/*.webp', '**/*.avif'],
    }).filter((file) => !isCopyFile(file) && !isSkipConvertFile(file));
};

// コピー対象（SVG・GIF・WebP・AVIF・ICO・WebManifest＋変換スキップディレクトリのPNG/JPG）を検索する関数
const findCopyFiles = (dir, pattern = COPY_PATTERN) => {
    if (!fs.existsSync(dir)) return [];

    const copyFiles = globSync(`${dir}/${pattern}`).filter((file) => !isCopyFile(file));

    // favicon 配下の PNG/JPG は変換せずコピー対象に含める
    const skipConvertImages = SKIP_CONVERT_DIRS.flatMap((skipDir) =>
        globSync(`${dir}/${skipDir}/**/*.{png,jpg,jpeg}`).filter((file) => !isCopyFile(file))
    );

    return [...copyFiles, ...skipConvertImages];
};

/**
 * @description 画像ファイルをWebPとAVIFに変換する関数
 * @param {string} filePath - 変換する画像ファイルのパス
 * @param {'serve' | 'build'} mode - 変換モード（'serve' または 'build'）
 * @param {boolean} avif - AVIF変換を行うかどうか
 * @param {string|null} srcBaseDir - 入力元ベースディレクトリ（サブディレクトリ構造の基準）
 * @param {string|null} outBaseDir - 出力先ベースディレクトリ
 * @returns {Promise<void>} - 非同期に処理される
 */
const convertToWebPAndAVIF = async (filePath, mode = 'build', avif = VITE_AVIF_CONVERSION, srcBaseDir = null, outBaseDir = null) => {
    const ext = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath, ext);

    // srcBaseDir・outBaseDir が指定されている場合はサブディレクトリ構造を維持
    let dirName;
    if (srcBaseDir && outBaseDir) {
        const relativePath = path.relative(srcBaseDir, path.dirname(filePath));
        dirName = path.join(outBaseDir, relativePath);
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
        }
    } else {
        dirName = path.dirname(filePath);
    }

    if (!/\.(png|jpg|jpeg|gif)$/i.test(ext)) return;

    // favicon 配下は変換せずコピーするため、ここでは何もしない
    if (isSkipConvertFile(filePath)) return;

    try {
        // WebP変換を行う
        const webpPath = path.join(dirName, `${baseName}.webp`);
        if (!fs.existsSync(webpPath)) {
            await sharp(filePath).webp(config[mode].webpOptions).toFile(webpPath);
        }

        if (avif === 'true') {
            // AVIF変換を行う
            const avifPath = path.join(dirName, `${baseName}.avif`);
            if (!fs.existsSync(avifPath)) {
                await sharp(filePath).avif(config[mode].avifOptions).toFile(avifPath);
            }
        }
    } catch (err) {
        console.error('\u001b[1;31m WebP/AVIF変換エラー:', err);
    }
};

/**
 * @description SVG・GIF・WebP・AVIF・ICO・WebManifestファイルをディレクトリ構造を維持してコピーする関数
 * @param {string} filePath - コピー元ファイルのパス
 * @param {'serve' | 'build'} mode - 処理モード（将来の圧縮用）
 * @param {string} srcBaseDir - 入力元ベースディレクトリ
 * @param {string} outBaseDir - 出力先ベースディレクトリ
 * @returns {Promise<void>}
 */
const copyAssetFile = async (filePath, mode = 'build', srcBaseDir = SRC_DIR, outBaseDir = OUT_DIR) => {
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    const relativePath = path.relative(srcBaseDir, path.dirname(filePath));
    const destDir = path.join(outBaseDir, relativePath);
    const destPath = path.join(destDir, fileName);

    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // 既にコピー済みの場合はスキップ
    if (fs.existsSync(destPath)) return;

    try {
        fs.copyFileSync(filePath, destPath);
    } catch (err) {
        console.error('\u001b[1;31m ファイルコピーエラー:', err);
    }
};

export default function vitePluginWatchAndConvert(command = 'serve') {
    // バッチ処理で画像を変換する関数
    const processImagesBatch = async (imageFiles) => {
        console.log(`\u001b[1;34m ${imageFiles.length} 個の画像をバッチ処理で変換します`);

        for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
            const batch = imageFiles.slice(i, i + BATCH_SIZE);

            // バッチ内の画像を並行処理（サブディレクトリ構造を維持して出力）
            await Promise.all(batch.map((filePath) => convertToWebPAndAVIF(filePath, 'build', VITE_AVIF_CONVERSION, SRC_DIR, OUT_DIR)));

            // 次のバッチまで少し待機（メモリ解放のため）
            if (i + BATCH_SIZE < imageFiles.length) {
                await new Promise((resolve) => setTimeout(resolve, PROCESS_INTERVAL));
            }

            console.log(`\u001b[1;34m バッチ ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(imageFiles.length / BATCH_SIZE)} 完了`);
        }

        console.log('\u001b[1;34m すべての画像のWebP/AVIF変換が完了しました');
    };

    // SVG・GIF・WebP・AVIF・ICO・WebManifestファイルをまとめてコピーする関数
    const processCopyFilesBatch = async (copyFiles) => {
        console.log(`\u001b[1;34m ${copyFiles.length} 個のSVG/GIF/WebP/AVIF/ICO/WebManifestファイルをコピーします`);

        for (let i = 0; i < copyFiles.length; i += BATCH_SIZE) {
            const batch = copyFiles.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map((filePath) => copyAssetFile(filePath, 'build', SRC_DIR, OUT_DIR)));
        }

        console.log('\u001b[1;34m すべてのSVG/GIF/WebP/AVIF/ICO/WebManifestファイルのコピーが完了しました');
    };

    // 開発サーバー起動前にすべての画像を同期的に処理する関数
    const processAllImagesBeforeServerStart = async () => {
        if (!fs.existsSync(SRC_DIR)) return;

        const imageFiles = findImageFiles(SRC_DIR);
        const copyFiles = findCopyFiles(SRC_DIR);

        // SVG・GIF・WebP・AVIF・ICO・WebManifestファイルをコピー → 画像をWebP/AVIF変換
        await processCopyFilesBatch(copyFiles);
        await processImagesBatch(imageFiles);
    };

    // 監視対象のディレクトリを再帰的にすべて取得
    const getTargetDirectories = (dir = SRC_DIR) => {
        if (!fs.existsSync(dir)) return [];

        const targetsDir = [dir];

        fs.readdirSync(dir, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .forEach((dirent) => {
                targetsDir.push(...getTargetDirectories(path.join(dir, dirent.name)));
            });

        return targetsDir;
    };

    return {
        name: 'vite-plugin-watch-and-convert-webp',
        // 最も早いタイミングでWebP変換を実行
        configResolved() {
            // 開発モードの場合のみ事前変換を実行
            if (command !== 'build') {
                // Viteの起動メッセージの後に表示されるように少し遅延
                setTimeout(() => {
                    console.log(`┃ WordPress \u001b[1;36m http://localhost:${WP_PORT}/wp-admin/\u001b[0m`);
                    console.log(`┃ WordPress \u001b[1;36m http://${getLocalIpAddress()}:${WP_PORT}/wp-admin/\u001b[0m`);
                }, 400);
                return processAllImagesBeforeServerStart();
            }
        },
        configureServer() {
            if (!fs.existsSync(SRC_DIR)) return;

            // 監視開始
            getTargetDirectories().forEach((dir) => {
                fs.watch(dir, (eventType, filename) => {
                    if (!filename || /\.webp$|\.avif$/i.test(filename) || isCopyFile(filename)) return;

                    const filePath = path.join(dir, filename);
                    if (eventType !== 'rename' || !fs.existsSync(filePath)) return;

                    // favicon 配下は WebP/AVIF 変換せずそのままコピー
                    if (isSkipConvertFile(filePath)) {
                        copyAssetFile(filePath, 'build', SRC_DIR, OUT_DIR);
                        return;
                    }

                    // SVG・GIF・WebP・AVIF・ICO・WebManifestはそのままコピー
                    if (/\.(svg|gif|webp|avif|ico|webmanifest)$/i.test(filename)) {
                        copyAssetFile(filePath, 'build', SRC_DIR, OUT_DIR);
                        return;
                    }

                    // PNG・JPGはWebP/AVIF変換（サブディレクトリ構造を維持）
                    if (/\.(png|jpg|jpeg)$/i.test(filename)) {
                        convertToWebPAndAVIF(filePath, 'build', VITE_AVIF_CONVERSION, SRC_DIR, OUT_DIR);
                    }
                });
            });
        },
    };
}
