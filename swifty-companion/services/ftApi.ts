// src/services/ftApi.ts
const FT_UID = process.env.EXPO_PUBLIC_FT_UID as string;
const FT_SECRET = process.env.EXPO_PUBLIC_FT_SECRET as string;
const FT_BASE_URL = "https://api.intra.42.fr";

let accessToken: string | null = null;
let expiresAt: number | null = null; // timestamp en ms

function toBase64(str: string) {
    if (typeof global.btoa !== "undefined") {
        return global.btoa(str);
    }
    // fallback si jamais btoa n'existe pas (vieilles versions)
    return Buffer.from(str, "utf8").toString("base64");
}

async function fetchToken() {
    if (!FT_UID || !FT_SECRET) {
        throw new Error("FT_UID ou FT_SECRET manquant (check ton .env)");
    }

    const basicAuth = toBase64(`${FT_UID}:${FT_SECRET}`);

    const res = await fetch(`${FT_BASE_URL}/oauth/token`, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    if (!res.ok) {
        const text = await res.text();
        console.log("Token error:", text);
        throw new Error("Impossible de récupérer le token 42");
    }

    const data = await res.json();
    accessToken = data.access_token;
    const expiresIn = data.expires_in; // en secondes
    // petit buffer de 60s
    expiresAt = Date.now() + (expiresIn - 60) * 1000;
}

async function ensureToken() {
    if (!accessToken || !expiresAt || Date.now() >= expiresAt) {
        await fetchToken();
    }
}

async function apiGet(path: string) {
    await ensureToken();

    const res = await fetch(`${FT_BASE_URL}${path}`, {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    if (res.status === 401) {
        // token invalide → on tente un refresh une fois
        await fetchToken();
        const retry = await fetch(`${FT_BASE_URL}${path}`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        });
        if (!retry.ok) {
            throw new Error(`Erreur API 42 (${retry.status})`);
        }
        return retry.json();
    }

    if (!res.ok) {
        const text = await res.text();
        console.log("API error:", text);
        throw new Error(`Erreur API 42 (${res.status})`);
    }

    return res.json();
}

// ---- helpers métier ----

// Récupérer un user par login
export async function getUserByLogin(login: string) {
    // Beaucoup font /v2/users/:login, à tester avec ton intra :contentReference[oaicite:4]{index=4}
    return apiGet(`/v2/users/${login}`);
}

// Plus tard: get projets, skills, etc. (mais dans la réponse user tu as déjà beaucoup d'infos)
