// Sinkronisasi data planner dengan database (Netlify Database lewat /api/data).
// Setiap item (vendor per kategori, seserahan, checklist, tamu, pengaturan) disimpan
// sebagai satu baris, sehingga perubahan dari banyak orang/perangkat bisa digabung.
(function () {
    const API = '/api/data';
    const SETTING_KEYS = ['groomName', 'brideName', 'weddingDate', 'maxBudget'];
    const LIST_KEYS = ['seserahan', 'checklist', 'guests'];

    const keyOf = (r) => r.collection + '::' + r.itemId;

    // Ubah state planner menjadi daftar record. Posisi item lama dipertahankan
    // (diambil dari snapshot terakhir) agar tidak menimpa data orang lain.
    function toRecords(state, knownMap) {
        const out = [];
        const known = knownMap || new Map();
        const nextPos = {};
        known.forEach((rec) => {
            nextPos[rec.collection] = Math.max(nextPos[rec.collection] ?? -1, rec.position ?? 0);
        });
        const posFor = (collection, itemId, fallbackIndex) => {
            const prev = known.get(collection + '::' + itemId);
            if (prev) return prev.position;
            if (!known.size) return fallbackIndex;
            nextPos[collection] = (nextPos[collection] ?? -1) + 1;
            return nextPos[collection];
        };

        SETTING_KEYS.forEach((k, i) => {
            if (state[k] !== undefined && state[k] !== null) {
                out.push({ collection: 'settings', itemId: k, data: { value: state[k] }, position: i });
            }
        });
        Object.keys(state.vendors || {}).forEach((catKey, i) => {
            out.push({ collection: 'vendors', itemId: catKey, data: state.vendors[catKey], position: posFor('vendors', catKey, i) });
        });
        LIST_KEYS.forEach((listKey) => {
            (state[listKey] || []).forEach((item, i) => {
                if (!item || !item.id) return;
                out.push({ collection: listKey, itemId: String(item.id), data: item, position: posFor(listKey, String(item.id), i) });
            });
        });
        return out;
    }

    // Ubah daftar record dari server menjadi state planner.
    function fromRecords(records, defaults) {
        const sorted = [...records].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        const state = {
            groomName: defaults.groomName,
            brideName: defaults.brideName,
            weddingDate: defaults.weddingDate,
            maxBudget: defaults.maxBudget,
            vendors: {},
            seserahan: [],
            checklist: [],
            guests: []
        };
        sorted.forEach((r) => {
            if (r.collection === 'settings' && SETTING_KEYS.includes(r.itemId)) {
                state[r.itemId] = r.data && r.data.value !== undefined ? r.data.value : state[r.itemId];
            } else if (r.collection === 'vendors') {
                const cat = r.data || {};
                if (!Array.isArray(cat.options)) cat.options = [];
                state.vendors[r.itemId] = cat;
            } else if (LIST_KEYS.includes(r.collection)) {
                state[r.collection].push(r.data);
            }
        });
        if (!Object.keys(state.vendors).length) state.vendors = JSON.parse(JSON.stringify(defaults.vendors));
        if (typeof state.maxBudget !== 'number') state.maxBudget = parseFloat(state.maxBudget) || defaults.maxBudget;
        return state;
    }

    function toMap(records) {
        const m = new Map();
        records.forEach((r) => m.set(keyOf(r), { collection: r.collection, itemId: r.itemId, data: r.data, position: r.position ?? 0 }));
        return m;
    }

    // Hitung perbedaan antara snapshot lama dan baru.
    function diff(prevMap, nextRecords) {
        const nextMap = toMap(nextRecords);
        const upserts = [];
        const deletes = [];
        nextMap.forEach((rec, key) => {
            const prev = prevMap.get(key);
            if (!prev || JSON.stringify(prev.data) !== JSON.stringify(rec.data) || prev.position !== rec.position) {
                upserts.push(rec);
            }
        });
        prevMap.forEach((rec, key) => {
            if (!nextMap.has(key)) deletes.push({ collection: rec.collection, itemId: rec.itemId });
        });
        return { upserts, deletes, nextMap };
    }

    async function fetchAll() {
        const res = await fetch(API, { cache: 'no-store' });
        if (!res.ok) throw new Error('Gagal memuat data (' + res.status + ')');
        const json = await res.json();
        return json.records || [];
    }

    async function push(upserts, deletes) {
        if (!upserts.length && !deletes.length) return;
        const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ upserts, deletes })
        });
        if (!res.ok) throw new Error('Gagal menyimpan data (' + res.status + ')');
    }

    const mapSignature = (m) => JSON.stringify([...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)));

    window.PlannerSync = { toRecords, fromRecords, toMap, diff, fetchAll, push, mapSignature, keyOf };
})();
