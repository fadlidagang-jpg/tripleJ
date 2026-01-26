
export interface KamarData {
    id: string;
    nomorKamar: string;
    gedung: string;
    lantai: string;
    status: string;
    namaPenyewa: string;
    noTelepon: string;
    hargaSewa: string;
    tanggalMasuk: string;
    durasiSewa: string;
    catatan: string;
}

const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

export const getSheetData = async (spreadsheetId: string, range: string): Promise<KamarData[]> => {
    if (!API_KEY) {
        throw new Error("Google Sheets API Key is missing. Please set VITE_GOOGLE_SHEETS_API_KEY in your environment variables.");
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || response.statusText);
        }

        const data = await response.json();
        const rows = data.values;

        if (!rows || rows.length === 0) {
            return [];
        }

        // Assuming the first row might be headers, but the user didn't explicitly say so.
        // However, usually we skip headers or map by index.
        // Given the explicit structure: ID, Nomor Kamar, Gedung, Lantai, Status, Nama Penyewa, No. Telepon, Harga Sewa, Tanggal Masuk, Durasi Sewa
        // We will assume the order matches the columns A-J.

        return rows.map((row: string[]) => ({
            id: row[0] || "",
            nomorKamar: row[1] || "",
            gedung: row[2] || "",
            lantai: row[3] || "",
            status: row[4] || "",
            namaPenyewa: row[5] || "",
            noTelepon: row[6] || "",
            hargaSewa: row[7] || "",
            tanggalMasuk: row[8] || "",
            durasiSewa: row[9] || "",
            catatan: row[10] || "",
        }));

    } catch (error) {
        console.error("Error fetching Google Sheets data:", error);
        throw error;
    }
};

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

export const saveRow = async (action: 'create' | 'update', data: KamarData): Promise<any> => {
    if (!SCRIPT_URL) {
        console.warn("VITE_GOOGLE_SCRIPT_URL is not set. Data will not be saved to Google Sheets.");
        return;
    }

    // Google Apps Script expects POST requests to be textual (no CORS preflight often preferred by using text/plain)
    // using 'no-cors' mode might be tricky for getting response, but usually regular POST with Content-Type: text/plain works with simple requests.
    // However, for best results with Apps Script Web App, we often use:

    const payload = {
        action: action,
        payload: data
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            // mode: 'no-cors' as RequestMode, // Try standard first, usually works if script is set to "Anyone"
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.result === 'error') {
            throw new Error(result.message || result.error);
        }
        return result;
    } catch (error) {
        console.error("Error saving to Google Sheets:", error);
        throw error;
    }
};

export const deleteRow = async (id: string): Promise<any> => {
    if (!SCRIPT_URL) {
        console.warn("VITE_GOOGLE_SCRIPT_URL is not set. Data will not be deleted from Google Sheets.");
        return;
    }

    const payload = {
        action: 'delete',
        id: id
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.result === 'error') {
            throw new Error(result.message || result.error);
        }
        return result;
    } catch (error) {
        console.error("Error deleting from Google Sheets:", error);
        throw error;
    }
};
