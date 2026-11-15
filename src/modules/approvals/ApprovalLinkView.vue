<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import moment from 'moment-timezone';
import { Button, Textarea } from 'primevue';

/**
 * Página pública del enlace que llega por SMS a cada super admin: muestra la
 * solicitud del Admin Papel y permite aprobarla o rechazarla sin iniciar sesión.
 * El token del enlace es la credencial (un solo uso, por admin).
 */
interface LinkView {
    code: string;
    summary: string;
    method: string;
    requesterName: string | null;
    createdAt: string;
    status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed' | 'expired';
    decidedByName: string | null;
    decidedAt: string | null;
    comment: string | null;
    error: string | null;
    adminName: string | null;
    expired: boolean;
    used: boolean;
}

const route = useRoute();
const token = String(route.params.token ?? '');
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

const loading = ref(true);
const sending = ref<'approve' | 'reject' | null>(null);
const data = ref<LinkView | null>(null);
const error = ref<string | null>(null);
const comment = ref('');

const messageFrom = (e: any, fallback: string) => {
    const m = e?.response?.data?.message;
    return Array.isArray(m) ? m.join(' ') : (m || fallback);
};

const load = async () => {
    loading.value = true;
    error.value = null;
    try {
        data.value = (await api.get<LinkView>(`/approvals/link/${encodeURIComponent(token)}`)).data;
    } catch (e: any) {
        error.value = messageFrom(e, 'No se pudo abrir la solicitud.');
    } finally {
        loading.value = false;
    }
};

const decide = async (decision: 'approve' | 'reject') => {
    sending.value = decision;
    error.value = null;
    try {
        data.value = (await api.post<LinkView>(
            `/approvals/link/${encodeURIComponent(token)}/${decision}`,
            { comment: comment.value.trim() || undefined },
        )).data;
    } catch (e: any) {
        error.value = messageFrom(e, 'No se pudo guardar la decisión.');
        await load();
    } finally {
        sending.value = null;
    }
};

const isPending = computed(() => data.value?.status === 'pending' && !data.value.used && !data.value.expired);

const statusInfo = computed(() => {
    const s = data.value?.status;
    const by = data.value?.decidedByName ? ` por ${data.value.decidedByName}` : '';
    switch (s) {
        case 'executed': return { label: `Aprobada${by} y aplicada`, cls: 'ok' };
        case 'approved': return { label: `Aprobada${by}`, cls: 'ok' };
        case 'failed': return { label: `Aprobada${by}, pero falló al aplicarse`, cls: 'warn' };
        case 'rejected': return { label: `Rechazada${by}`, cls: 'bad' };
        case 'expired': return { label: 'Vencida', cls: 'muted' };
        default: return { label: 'Pendiente de aprobación', cls: 'pending' };
    }
});

const createdLabel = computed(() =>
    data.value?.createdAt ? moment(data.value.createdAt).format('MM/DD/YYYY h:mm A') : '',
);

onMounted(load);
</script>

<template>
    <main class="approval-link">
        <section class="card">
            <img src="/images/logoqps.png" alt="QPS" class="logo" />

            <p v-if="loading" class="muted center">Cargando solicitud…</p>

            <template v-else-if="data">
                <p class="eyebrow">Solicitud {{ data.code }}</p>
                <h1>{{ data.requesterName || 'Admin Papel' }} quiere:</h1>
                <p class="summary">{{ data.summary }}</p>
                <p class="muted small">{{ createdLabel }}<span v-if="data.adminName"> · Para {{ data.adminName }}</span></p>

                <div class="status" :class="statusInfo.cls">{{ statusInfo.label }}</div>
                <p v-if="!isPending && data.comment" class="small"><strong>Comentario:</strong> {{ data.comment }}</p>
                <p v-if="data.status === 'failed' && data.error" class="small bad-text">{{ data.error }}</p>

                <template v-if="isPending">
                    <label for="comment" class="small muted">Comentario (opcional)</label>
                    <Textarea id="comment" v-model="comment" rows="3" auto-resize class="w-full"
                        placeholder="Ej: falta la fecha, cambia el precio…" />
                    <div class="actions">
                        <Button label="Rechazar" severity="danger" outlined icon="pi pi-times"
                            :loading="sending === 'reject'" :disabled="!!sending" @click="decide('reject')" />
                        <Button label="Aprobar" severity="success" icon="pi pi-check"
                            :loading="sending === 'approve'" :disabled="!!sending" @click="decide('approve')" />
                    </div>
                </template>
                <p v-else-if="data.used" class="muted small center">Ya usaste este enlace.</p>
            </template>

            <p v-if="error" class="error">{{ error }}</p>
        </section>
    </main>
</template>

<style scoped>
.approval-link {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: #f6f4ef;
}
.card {
    width: 100%;
    max-width: 440px;
    background: #fff;
    border-radius: 18px;
    padding: 28px 22px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.logo { width: 120px; align-self: center; margin-bottom: 8px; }
.eyebrow { font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; color: #b8860b; font-weight: 700; }
h1 { font-size: 1.15rem; font-weight: 600; color: #0f2a4a; }
.summary { font-size: 1.1rem; color: #111827; line-height: 1.4; }
.small { font-size: 0.85rem; }
.muted { color: #6b7280; }
.center { text-align: center; }
.status { margin: 6px 0; padding: 10px 12px; border-radius: 10px; font-weight: 600; font-size: 0.95rem; }
.status.pending { background: #fff7e6; color: #b45309; }
.status.ok { background: #ecfdf5; color: #047857; }
.status.bad { background: #fef2f2; color: #b91c1c; }
.status.warn { background: #fffbeb; color: #b45309; }
.status.muted { background: #f3f4f6; color: #6b7280; }
.bad-text { color: #b91c1c; }
.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
.actions :deep(.p-button) { width: 100%; padding: 14px; font-size: 1rem; }
.error { color: #b91c1c; background: #fef2f2; padding: 10px 12px; border-radius: 10px; font-size: 0.9rem; }
</style>
