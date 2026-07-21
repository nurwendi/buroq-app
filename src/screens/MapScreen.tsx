import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, ActivityIndicator } from 'react-native';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { customerService } from '../services/customerService';
import { pppoeService } from '../services/pppoeService';
import apiClient from '../api/client';
import COLORS from '../constants/colors';

export default function MapScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapHtml, setMapHtml] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [customersData, activeData, devicesData] = await Promise.all([
        customerService.getCustomers(false),
        pppoeService.getActiveConnections().catch(() => []),
        apiClient.get('/genieacs/devices').catch(() => ({ data: [] }))
      ]);

      const activeMap = new Map((activeData || []).map((conn: any) => [String(conn.name || "").toLowerCase(), conn]));
      
      const devices = devicesData?.data || [];
      const acsMap: Record<string, string> = {};
      if (Array.isArray(devices)) {
        devices.forEach(dev => {
          if (dev.pppoe_user) {
            acsMap[String(dev.pppoe_user || "").toLowerCase()] = dev.rx_power;
          }
        });
      }
      
      const markers: any[] = [];
      let centerLat = -6.200000;
      let centerLng = 106.816666;

      if (customersData && Array.isArray(customersData)) {
        customersData.forEach((c: any) => {
          if (c?.coordinates) {
            const parts = c.coordinates.split(',');
            if (parts.length === 2) {
              const latStr = parts[0].trim();
              const lngStr = parts[1].trim();
              const lat = parseFloat(latStr);
              const lng = parseFloat(lngStr);
              if (!isNaN(lat) && !isNaN(lng)) {
                const isOnline = c.username ? activeMap.has(String(c.username || "").toLowerCase()) : false;
                
                let statusColor = 'emerald';
                let statusText = 'Aktif';

                if (c.disabled) {
                    statusColor = 'orange';
                    statusText = 'Isolir';
                } else if (!isOnline) {
                    statusColor = 'rose';
                    statusText = 'Offline';
                }

                let colorClass = 'fill-emerald-500';
                let pulseClass = 'bg-emerald-500';

                if (statusColor === 'rose') {
                  colorClass = 'fill-rose-500';
                  pulseClass = 'bg-rose-500';
                } else if (statusColor === 'orange') {
                  colorClass = 'fill-orange-500';
                  pulseClass = 'bg-orange-500';
                }

                let badgeClass = 'bg-green-100 text-green-700';
                if (statusColor === 'rose') badgeClass = 'bg-red-100 text-red-700';
                if (statusColor === 'orange') badgeClass = 'bg-orange-100 text-orange-700';

                const rxPower = c.username ? (acsMap[String(c.username || "").toLowerCase()] || '-') : '-';
                const rxDisplay = rxPower !== '-' ? `${rxPower} dBm` : '-';
                
                const markerHtml = `
                  <div class="relative flex items-center justify-center w-10 h-10">
                    <span class="absolute inline-flex h-full w-full rounded-full ${pulseClass} opacity-30 animate-ping" style="animation-duration: 2.5s;"></span>
                    <span class="absolute inline-flex h-8 w-8 rounded-full ${pulseClass} opacity-10"></span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" class="text-white ${colorClass} filter drop-shadow transition-all duration-300">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                  </div>
                `;

                const popupHtml = `
                  <div class="popup-container">
                    <h3>${c.name} | ${c.username}</h3>
                    <div class="popup-content">
                      <p><strong>No. HP:</strong> ${c.phone || '-'}</p>
                      <p><strong>Redaman:</strong> ${rxDisplay}</p>
                      <p><strong>Alamat:</strong> ${c.address || '-'}</p>
                      <p class="status-row">
                        <strong>Status:</strong>
                        <span class="status-badge ${badgeClass}">${statusText}</span>
                      </p>
                    </div>
                  </div>
                `;

                markers.push(`
                  var customIcon = L.divIcon({
                    className: 'custom-leaflet-marker-wrapper',
                    html: \`${markerHtml}\`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40],
                    popupAnchor: [0, -40]
                  });
                  L.marker([${lat}, ${lng}], {icon: customIcon})
                   .bindPopup(\`${popupHtml}\`)
                   .addTo(map);
                `);

                // Update center to last valid point
                centerLat = lat;
                centerLng = lng;
              }
            }
          }
        });
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { padding: 0; margin: 0; }
            #map { height: 100vh; width: 100vw; }
            .custom-leaflet-marker-wrapper {
              background: transparent;
              border: none;
            }
            .leaflet-popup-content-wrapper {
              box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
              border-radius: 8px;
            }
            .leaflet-popup-content {
              margin: 12px 16px !important;
            }
            .popup-container h3 {
              font-weight: bold;
              font-size: 14px;
              margin: 0 0 4px 0;
              padding-bottom: 4px;
              border-bottom: 1px solid #e2e8f0;
            }
            .popup-content {
              font-size: 12px;
              margin-top: 8px;
            }
            .popup-content p {
              margin: 4px 0;
            }
            .status-row {
              margin-top: 8px !important;
              padding-top: 4px;
              border-top: 1px dashed #e2e8f0;
            }
            .status-badge {
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
            }
            .drop-shadow { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map').setView([${centerLat}, ${centerLng}], 12);
            
            var googleJalan = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                attribution: '&copy; Google Maps'
            });
            
            var googleSatelit = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                attribution: '&copy; Google Maps'
            });
            
            var googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                attribution: '&copy; Google Maps'
            });
            
            var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            });

            googleJalan.addTo(map); // default

            var baseMaps = {
                "Google Maps (Jalan)": googleJalan,
                "Google Maps (Satelit)": googleSatelit,
                "Google Maps (Hybrid)": googleHybrid,
                "OpenStreetMap": osm
            };

            L.control.layers(baseMaps).addTo(map);
            
            ${markers.join('\n')}
            
            // Auto fit bounds if multiple markers exist
            var group = new L.featureGroup(Object.values(map._layers).filter(l => l instanceof L.Marker));
            if(group.getBounds().isValid() && Object.keys(group._layers).length > 0) {
                map.fitBounds(group.getBounds(), {padding: [30, 30]});
            }
          </script>
        </body>
        </html>
      `;

      setMapHtml(html);
    } catch (err) {
      console.error(err);
      setError("Gagal: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('dashboard.customerMap') || 'Peta Pelanggan'}</Text>
        <TouchableOpacity onPress={fetchData} style={styles.refreshButton}>
          <RefreshCw size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Memuat peta...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <AlertCircle size={48} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchData} style={styles.retryButton}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            source={{ html: mapHtml }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  webview: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  }
});
