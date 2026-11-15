<template>
  <div class="aprobaciones p-4">
    <h2 class="text-2xl font-bold mb-1">{{ isAdmin ? 'Solicitudes de aprobación' : 'Mis solicitudes' }}</h2>
    <p class="text-sm text-gray-500 mb-5">
      <template v-if="isAdmin">
        Cambios pedidos por el Admin Papel. También se pueden aprobar por SMS respondiendo
        <strong>SI &lt;código&gt;</strong> o <strong>NO &lt;código&gt; &lt;comentario&gt;</strong>.
      </template>
      <template v-else>
        Tus cambios quedan aquí hasta que un administrador los apruebe o rechace.
      </template>
    </p>

    <div class="flex flex-wrap items-end gap-3 mb-4">
      <div class="flex flex-col">
        <label class="font-semibold text-sm mb-1" for="approval-status">Estado</label>
        <Select
          v-model="statusFilter"
          inputId="approval-status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          class="w-52"
          @change="reload"
        />
      </div>
      <Button label="Actualizar" icon="pi pi-refresh" severity="secondary" outlined :loading="loading" @click="reload" />
    </div>

    <DataTable
      :value="rows"
      lazy
      paginator
      :rows="take"
      :totalRecords="totalRecords"
      :first="(page - 1) * take"
      :loading="loading"
      dataKey="id"
      stripedRows
      scrollable
      @page="onPage"
    >
      <template #empty>No hay solicitudes.</template>
      <Column header="Código" style="width: 6rem">
        <template #body="{ data }"><strong>{{ data.code }}</strong></template>
      </Column>
      <Column header="Fecha" style="min-width: 9rem">
        <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
      </Column>
      <Column v-if="isAdmin" header="Solicitante" style="min-width: 9rem">
        <template #body="{ data }">{{ data.user?.name ?? '—' }}</template>
      </Column>
      <Column header="Solicitud" style="min-width: 18rem">
        <template #body="{ data }">
          <div>{{ data.summary }}</div>
          <div class="text-xs text-gray-500">{{ data.method }} {{ data.url }}</div>
        </template>
      </Column>
      <Column header="Estado" style="width: 9rem">
        <template #body="{ data }">
          <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column header="Decisión" style="min-width: 12rem">
        <template #body="{ data }">
          <template v-if="data.decidedByUser">
            <div>{{ data.decidedByUser.name }} <span class="text-xs text-gray-500">({{ data.decisionChannel === 'sms' ? 'SMS' : 'web' }})</span></div>
            <div v-if="data.decidedAt" class="text-xs text-gray-500">{{ formatDate(data.decidedAt) }}</div>
          </template>
          <span v-else>—</span>
        </template>
      </Column>
      <Column header="Comentario / resultado" style="min-width: 14rem">
        <template #body="{ data }">
          <div v-if="data.comment">{{ data.comment }}</div>
          <div v-if="data.error" class="text-xs text-red-600">{{ data.error }}</div>
          <span v-if="!data.comment && !data.error">—</span>
        </template>
      </Column>
      <Column v-if="!isAdmin" header="" style="width: 11rem">
        <template #body="{ data }">
          <div v-if="data.status === 'pending'" class="flex flex-col items-start gap-1">
            <Button label="Reenviar SMS" icon="pi pi-send" size="small" severity="secondary" outlined
              :loading="reminding === data.id" @click="remind(data)" />
            <small v-if="data.remindCount" class="text-gray-500">
              Reenviada {{ data.remindCount }} {{ data.remindCount === 1 ? 'vez' : 'veces' }}
            </small>
          </div>
        </template>
      </Column>
      <Column v-if="isAdmin" header="" style="width: 13rem">
        <template #body="{ data }">
          <div v-if="data.status === 'pending'" class="flex gap-2">
            <Button label="Aprobar" icon="pi pi-check" size="small" severity="success" @click="openDecision(data, 'approve')" />
            <Button label="Rechazar" icon="pi pi-times" size="small" severity="danger" outlined @click="openDecision(data, 'reject')" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="decisionDialog"
      modal
      :header="decision === 'approve' ? `Aprobar ${selected?.code}` : `Rechazar ${selected?.code}`"
      :style="{ width: '32rem', maxWidth: '95vw' }"
    >
      <p class="mb-3">{{ selected?.summary }}</p>
      <label class="font-semibold text-sm mb-1 block" for="approval-comment">Comentario (opcional)</label>
      <Textarea id="approval-comment" v-model="comment" rows="3" class="w-full" autoResize />
      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="decisionDialog = false" />
        <Button
          :label="decision === 'approve' ? 'Aprobar y aplicar' : 'Rechazar'"
          :severity="decision === 'approve' ? 'success' : 'danger'"
          :loading="deciding"
          @click="confirmDecision"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Button, Column, DataTable, Dialog, Select, Tag, Textarea, useToast } from 'primevue';
import moment from 'moment-timezone';

import { ApprovalsServices, type Approval, type ApprovalStatus } from './approvals.services';

const props = defineProps<{ mode: 'admin' | 'mine' }>();
const isAdmin = computed(() => props.mode === 'admin');

const toast = useToast();

const rows = ref<Approval[]>([]);
const totalRecords = ref(0);
const page = ref(1);
const take = 20;
const loading = ref(false);
const statusFilter = ref<ApprovalStatus | null>(isAdmin.value ? 'pending' : null);

const statusOptions: { label: string; value: ApprovalStatus | null }[] = [
  { label: 'Todas', value: null },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Aplicadas', value: 'executed' },
  { label: 'Rechazadas', value: 'rejected' },
  { label: 'Fallidas', value: 'failed' },
  { label: 'Expiradas', value: 'expired' },
  { label: 'En ejecución', value: 'approved' },
];

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'Pendiente',
  approved: 'En ejecución',
  executed: 'Aplicada',
  rejected: 'Rechazada',
  failed: 'Falló',
  expired: 'Expirada',
};

const statusLabel = (status: ApprovalStatus) => STATUS_LABELS[status] ?? status;

const statusSeverity = (status: ApprovalStatus) => {
  switch (status) {
    case 'pending': return 'warn';
    case 'approved': return 'info';
    case 'executed': return 'success';
    case 'rejected':
    case 'failed': return 'danger';
    default: return 'secondary';
  }
};

const formatDate = (value?: string | null) => (value ? moment(value).format('MM/DD/YYYY h:mm A') : '—');

const load = async () => {
  loading.value = true;
  try {
    const result = await ApprovalsServices.list(page.value, take, statusFilter.value);
    rows.value = result.data;
    totalRecords.value = result.meta?.totalCount ?? result.data.length;
  } catch (error) {
    rows.value = [];
    totalRecords.value = 0;
    toast.add({ severity: 'error', summary: 'No se pudieron cargar las solicitudes.', life: 3000 });
  } finally {
    loading.value = false;
  }
};

const reload = () => {
  page.value = 1;
  load();
};

const onPage = (event: { page: number }) => {
  page.value = event.page + 1;
  load();
};

const decisionDialog = ref(false);
const decision = ref<'approve' | 'reject'>('approve');
const selected = ref<Approval | null>(null);
const comment = ref('');
const deciding = ref(false);

const openDecision = (row: Approval, kind: 'approve' | 'reject') => {
  selected.value = row;
  decision.value = kind;
  comment.value = '';
  decisionDialog.value = true;
};

const confirmDecision = async () => {
  if (!selected.value) return;
  deciding.value = true;
  try {
    const text = comment.value.trim() || undefined;
    const result = decision.value === 'approve'
      ? await ApprovalsServices.approve(selected.value.id, text)
      : await ApprovalsServices.reject(selected.value.id, text);

    if (result.status === 'executed') {
      toast.add({ severity: 'success', summary: `${result.code} aprobada y aplicada.`, life: 4000 });
    } else if (result.status === 'failed') {
      toast.add({ severity: 'error', summary: `${result.code} aprobada pero falló al aplicarse`, detail: result.error ?? '', life: 8000 });
    } else {
      toast.add({ severity: 'info', summary: `${result.code} ${statusLabel(result.status).toLowerCase()}.`, life: 4000 });
    }
    decisionDialog.value = false;
  } catch (error: any) {
    // 409: otro admin ya decidió (por SMS o web).
    const message = error?.response?.data?.message ?? 'No se pudo registrar la decisión.';
    toast.add({ severity: 'warn', summary: Array.isArray(message) ? message.join(', ') : message, life: 5000 });
    decisionDialog.value = false;
  } finally {
    deciding.value = false;
    load();
  }
};

const reminding = ref<string | null>(null);

/** Admin Papel: insiste reenviando el SMS con enlace a los admins (máx. cada 10 min). */
const remind = async (row: Approval) => {
  reminding.value = row.id;
  try {
    const res = await ApprovalsServices.remind(row.id);
    toast.add({ severity: 'success', summary: `SMS de ${res.code} reenviado a ${res.sentTo} administrador(es).`, life: 4000 });
    load();
  } catch (error: any) {
    const message = error?.response?.data?.message ?? 'No se pudo reenviar el SMS.';
    toast.add({ severity: 'warn', summary: Array.isArray(message) ? message.join(', ') : message, life: 5000 });
  } finally {
    reminding.value = null;
  }
};

onMounted(load);
</script>

<style scoped>
.aprobaciones :deep(.p-datatable) {
  font-size: 0.9rem;
}
</style>
