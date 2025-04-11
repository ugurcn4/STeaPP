import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

/**
 * Verilen medya URI'sini oynatılabilir/yüklenebilir bir URI'ye dönüştürür.
 * iOS'ta 'ph://' URI'leri için MediaLibrary'den localUri alır
 * ve videoyu önbelleğe kopyalar.
 * @param {object} media - Medya objesi { uri: string, type: 'photo' | 'video', id?: string }
 * @returns {Promise<string>} Oynatılabilir/yüklenebilir URI'yi içeren bir Promise.
 */
export const getPlayableMediaUri = async (media) => {
    if (!media || !media.uri || !media.type) {
        console.error("getPlayableMediaUri: Geçersiz medya objesi", media);
        return media?.uri || ''; // Hatalı durumda orijinal URI'yi dene
    }

    let playableUri = media.uri;
    const isIOSVideo = Platform.OS === 'ios' && media.type === 'video';

    // iOS videosu ve ph:// URI'si ise özel işlem yap
    if (isIOSVideo && media.uri.startsWith('ph://')) {
        try {
            // Varlık ID'si yoksa, URI'dan çıkarmayı dene (gerekli olabilir)
            const assetId = media.id || media.uri.substring(5, media.uri.indexOf('/'));
            if (!assetId) {
                throw new Error("Varlık ID'si alınamadı: " + media.uri);
            }

            const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId);

            if (assetInfo?.localUri) {
                let filename = assetInfo.filename;
                if (!filename) {
                    const uriPart = media.uri.split('#')[0].split('?')[0];
                    filename = uriPart.split('/').pop();
                }
                if (!filename || !filename.includes('.')) {
                    const extension = '.mp4';
                    filename = `${assetId}${extension}`;
                }

                const tempUri = FileSystem.cacheDirectory + filename;

                try {
                    const tempFileInfo = await FileSystem.getInfoAsync(tempUri);
                    if (!tempFileInfo.exists) {
                        console.log(`Kopyalanıyor (util): ${assetInfo.localUri} -> ${tempUri}`);
                        await FileSystem.copyAsync({
                            from: assetInfo.localUri,
                            to: tempUri
                        });
                    } else {
                        console.log('Dosya zaten önbellekte (util):', tempUri);
                    }
                    playableUri = tempUri;
                } catch (copyError) {
                    console.error('Video kopyalama hatası (util):', copyError);
                    playableUri = assetInfo.localUri; // Kopyalama başarısızsa localUri dene
                }
            } else {
                playableUri = assetInfo?.uri || media.uri;
                console.warn('localUri bulunamadı (util), doğrudan URI kullanılacak:', playableUri);
            }

            if (playableUri.startsWith('ph://')) {
                console.warn('İşlem sonrası URI hala ph:// (util)');
            }

        } catch (error) {
            console.error('iOS medya URI işleme hatası (util):', error);
            playableUri = media.uri; // Hata durumunda orijinal URI
        }
    }
    // Diğer durumlar (Android, fotoğraf) için URI aynı kalır
    else {
        playableUri = media.uri;
    }

    console.log(`getPlayableMediaUri Sonuç: ${media.uri} -> ${playableUri}`);
    return playableUri;
};
