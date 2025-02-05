import { regionToBoundingBox, distanceBetweenPoints } from './locationUtils';

export const CLUSTER_CONFIG = {
    radius: 50, // piksel cinsinden kümeleme yarıçapı
    maxZoom: 20,
    minZoom: 1,
    minPoints: 2, // minimum küme boyutu
    extent: 512,
    nodeSize: 64
};

export function createClusters(points, region, dimensions) {
    const clusters = [];
    const processed = new Set();

    // Harita sınırlarını hesapla
    const bbox = regionToBoundingBox(region);
    const zoom = getZoomLevel(region, dimensions);

    if (zoom >= CLUSTER_CONFIG.maxZoom) {
        return points.map(point => ({
            id: point.id,
            coordinate: point.coordinate,
            points: [point]
        }));
    }

    // Her nokta için
    points.forEach((point, index) => {
        if (processed.has(index)) return;

        const cluster = {
            id: `cluster-${index}`,
            coordinate: point.coordinate,
            points: [point]
        };

        // Yakındaki noktaları bul
        points.forEach((otherPoint, otherIndex) => {
            if (index === otherIndex || processed.has(otherIndex)) return;

            const distance = distanceBetweenPoints(
                point.coordinate,
                otherPoint.coordinate
            );

            if (distance <= CLUSTER_CONFIG.radius) {
                cluster.points.push(otherPoint);
                processed.add(otherIndex);

                // Küme merkezini güncelle
                cluster.coordinate = {
                    latitude: cluster.points.reduce((sum, p) => sum + p.coordinate.latitude, 0) / cluster.points.length,
                    longitude: cluster.points.reduce((sum, p) => sum + p.coordinate.longitude, 0) / cluster.points.length
                };
            }
        });

        if (cluster.points.length >= CLUSTER_CONFIG.minPoints) {
            clusters.push(cluster);
        } else if (cluster.points.length === 1) {
            clusters.push({
                ...cluster,
                id: point.id
            });
        }

        processed.add(index);
    });

    return clusters;
}

function getZoomLevel(region, dimensions) {
    const { longitudeDelta } = region;
    const { width } = dimensions;
    return Math.round(Math.log(360 / longitudeDelta) / Math.LN2);
} 