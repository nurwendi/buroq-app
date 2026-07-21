const fs = require('fs');
const path = 'c:/billing_pro/billing-app/src/screens/MapScreen.tsx';
let content = fs.readFileSync(path, 'utf8');
const search =                 markers.push(\\\
                  var customIcon = L.divIcon({
                    className: 'custom-leaflet-marker-wrapper',
                    html: \\\\\\\\\\\\\\\\\\\\\,
                    iconSize: [40, 40],
                    iconAnchor: [20, 40],
                    popupAnchor: [0, -40]
                  });
                  L.marker([\${lat}, \${lng}], {icon: customIcon})
                   .bindPopup(\\\\\\\\\\\\\\\\\\\\\)
                   .addTo(map);
                \\\);;

const replaceStr = "                markers.push(\n                  var customIcon = L.divIcon({\n                    className: 'custom-leaflet-marker-wrapper',\n                    html: \\${markerHtml}\\,\n                    iconSize: [40, 40],\n                    iconAnchor: [20, 40],\n                    popupAnchor: [0, -40]\n                  });\n                  L.marker([, ], {icon: customIcon})\n                   .bindPopup(\\${popupHtml}\\)\n                   .addTo(map);\n                );";

if (content.indexOf("html: \\\\\\") > -1) {
  content = content.replace(/markers\.push\(\\[\s\S]*?\\\);/, replaceStr);
  fs.writeFileSync(path, content, 'utf8');
} else {
  // Let's just do a regex replace
  content = content.replace(/markers\.push\(\\[\s\S]*?\\\);/, replaceStr);
  fs.writeFileSync(path, content, 'utf8');
}
