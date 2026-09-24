// utils/portMatcher.js
/**
 * Smart Port Normalizer & Matcher untuk Switch Cisco, Aruba, Huawei, Juniper, generic
 * Murni in-memory string parsing O(1), 100% aman dan EDR-Safe.
 */

/**
 * Normalisasi format string port menjadi bentuk kanonikal
 * Contoh: "GigabitEthernet1/0/1" -> "gi1/0/1"
 *         "TenGigabitEthernet1/1/1" -> "te1/1/1"
 *         "Port-channel40" -> "po40"
 *         "FastEthernet0/1" -> "fa0/1"
 *         "Port 1" / "1" -> "1"
 */
export const normalizePortString = (str = '') => {
    if (!str) return '';
    return str
        .toLowerCase()
        .trim()
        .replace(/^gigabitethernet/i, 'gi')
        .replace(/^tengigabitethernet/i, 'te')
        .replace(/^fastethernet/i, 'fa')
        .replace(/^port-channel\s*/i, 'po')
        .replace(/^port\s*/i, '')
        .replace(/^eth\s*/i, 'eth')
        .replace(/^ge-/i, 'ge')
        .replace(/[^a-z0-9\/]/g, '');
};

/**
 * Memeriksa apakah konfigurasi port perangkat di DB cocok dengan port hasil SNMP
 * @param {string} configuredPort Nilai kolom PORT di DB (misal: "Gi1/0/1", "1", "Po40", "GigabitEthernet1/0/1")
 * @param {string} snmpIfName Nilai ifName (misal: "Gi1/0/1", "Te1/1/1", "Po40")
 * @param {string} snmpIfDescr Nilai ifDescr (misal: "GigabitEthernet1/0/1")
 * @param {string} snmpIfAlias Nilai ifAlias / Port Description (misal: "To-PIK1SWI004")
 * @param {string} childDeviceIdentifier PID atau HOSTNAME perangkat anak (misal: "PIK1SWI004")
 * @returns {boolean}
 */
export const isPortMatching = (
    configuredPort = '',
    snmpIfName = '',
    snmpIfDescr = '',
    snmpIfAlias = '',
    childDeviceIdentifier = ''
) => {
    if (!configuredPort && !snmpIfAlias) return false;

    const normConfig = normalizePortString(configuredPort);
    const normIfName = normalizePortString(snmpIfName);
    const normIfDescr = normalizePortString(snmpIfDescr);

    // 1. Direct Normalized Match
    if (normConfig && (normConfig === normIfName || normConfig === normIfDescr)) {
        return true;
    }

    // 2. Trailing Number Match (misal di DB cuma ditulis "1" atau "15", di switch "Gi1/0/1" atau "Gi1/0/15" atau "Po40")
    if (normConfig) {
        // Jika config hanya angka murni (misal: "15")
        if (/^\d+$/.test(normConfig)) {
            // Cocokkan ujung slash (misal "gi1/0/15" -> ujungnya "15", atau "po40" -> "40")
            const ifNameTrailing = normIfName.split('/').pop()?.replace(/^[a-z]+/, '');
            const ifDescrTrailing = normIfDescr.split('/').pop()?.replace(/^[a-z]+/, '');
            if (normConfig === ifNameTrailing || normConfig === ifDescrTrailing) {
                return true;
            }
        }

        // Jika config berbentuk "1/0/15" dan ifName "gi1/0/15"
        if (normIfName.includes(normConfig) || normIfDescr.includes(normConfig)) {
            return true;
        }
    }

    // 3. Match via ifAlias / Port Description (misal di switch ditulis "To-PIK1SWI004" dan anak adalah "PIK1SWI004")
    if (snmpIfAlias && childDeviceIdentifier) {
        const cleanAlias = snmpIfAlias.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanChild = childDeviceIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanChild.length >= 3 && cleanAlias.includes(cleanChild)) {
            return true;
        }
    }

    return false;
};
