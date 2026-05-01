<script setup lang="ts">
import { useRoute } from 'vue-router';
import { CommunitiesServices } from './communities.services';
import { UsersServices } from '../users/users.services';
import { CompaniesServices } from '../companies/companies.services';
import { CleanersServices } from '../services/services.services';
import GenericEditForm from '../shared/views/GenericEditForm.vue';
import type { InputConfig } from '../../interfaces/input-config.interface';
import { Button, Calendar, Column, DataTable, Dialog, MultiSelect, useToast } from 'primevue';
import { ref, computed } from 'vue';
import type { User } from '../../interfaces/users/users.interface';
import type { Service } from '../../interfaces/services/services.interface';
import { showToast } from '../../utils/show-toast';

interface EntityData {
  communityName: string;
  companyId: string;
  userId: string[];
}

interface UpdateCommunityData {
  communityName: string;
  companyId: string;
  managerUserId: string | null;
  supervisorUserId: string | null;
}

const route = useRoute();
const toast = useToast();
const currentCommunityId = route.params.id as string;
const managers = ref<{ data: User[] }>({ data: [] });
const rangeStartDate = ref<Date | null>(null);
const rangeEndDate = ref<Date | null>(null);
const rangeServices = ref<Service[]>([]);
const hasSearchedRange = ref(false);
const isLoadingRange = ref(false);
const isDeletingRange = ref(false);
const showDeleteDialog = ref(false);
const entityData = ref<EntityData>({
  communityName: '',
  companyId: '',
  userId: []
});

// Computed property para formatear los nombres de usuarios con sus roles
const formattedManagers = computed(() => {
  return managers.value.data.map(user => ({
    ...user,
    formattedName: `${user.name} (${user.role.name})`
  }));
});

const handleUserSelection = (event: { value: string[] }) => {
  const selectedUsers = event.value;
  
  // Separar los usuarios seleccionados por rol
  const selectedManagers = selectedUsers
    .map(id => managers.value.data.find(u => u.id === id))
    .filter(user => user && user.role.id === "3");
  
  const selectedSupervisors = selectedUsers
    .map(id => managers.value.data.find(u => u.id === id))
    .filter(user => user && user.role.id === "6");

  // Tomar solo el último manager y el último supervisor si hay más de uno
  const finalSelection = [
    ...(selectedManagers.length > 0 ? [selectedManagers[selectedManagers.length - 1]!.id] : []),
    ...(selectedSupervisors.length > 0 ? [selectedSupervisors[selectedSupervisors.length - 1]!.id] : [])
  ];

  // Actualizar la selección
  entityData.value.userId = finalSelection;
};

const breadcrumbRoutes = [
  { label: 'Communities', to: { name: 'communities-default' } },
  { label: 'Edit', to: { name: 'communities-edit' } },
];

const inputs: InputConfig[] = [
  { label: 'Community name', inputId: 'communityName', inputType: 'input', required: true },
  { label: 'Company', inputId: 'companyId', inputType: 'select', options: [], required: true },
];

const keyValueMap = {
  companyId: 'company.id',
};

const loadData = async (id: string) => {
  const [companiesResult, usersResult, communityResult] = await Promise.all([
    CompaniesServices.getCompanies(),
    UsersServices.getUsers(undefined, 150),
    CommunitiesServices.getCommunityById(id),
  ]);

  // Filtrar usuarios con roleId 3 (Manager) o 6 (Supervisor)
  const filteredUsers = usersResult.data.filter(user => 
    user.role.id === "3" || user.role.id === "6"
  );

  managers.value.data = filteredUsers;

  // Obtener los IDs del manager y supervisor actuales desde la estructura correcta
  const selectedUserIds = [
    communityResult.managerUser?.id,
    communityResult.supervisorUser?.id
  ].filter(id => id !== undefined) as string[];
  
  entityData.value = {
    communityName: communityResult.communityName,
    companyId: communityResult.company.id,
    userId: selectedUserIds
  };

  return {
    ...communityResult,
    companyIdOptions: companiesResult.data.map((company) => ({
      label: company.companyName,
      value: company.id,
    })),
  };
};

// Computed property para mostrar los usuarios seleccionados actualmente
const selectedUsersInfo = computed(() => {
  const selectedUsers = entityData.value.userId
    .map(id => managers.value.data.find(u => u.id === id))
    .filter(user => user) as User[];

  const manager = selectedUsers.find(user => user.role.id === "3");
  const supervisor = selectedUsers.find(user => user.role.id === "6");

  return {
    manager,
    supervisor,
    hasManager: !!manager,
    hasSupervisor: !!supervisor,
    selectedCount: selectedUsers.length
  };
});

const rangeServiceCount = computed(() => rangeServices.value.length);

const rangeLabel = computed(() => {
  const start = rangeStartDate.value ? formatDisplayDate(formatDateParam(rangeStartDate.value)) : '';
  const end = rangeEndDate.value ? formatDisplayDate(formatDateParam(rangeEndDate.value)) : '';
  return start && end ? `${start} - ${end}` : '';
});

const formatDateParam = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date?: string | null) => {
  if (!date) return '-';

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

const formatSchedule = (schedule?: string | null) => {
  if (!schedule) return '-';
  return schedule.slice(0, 5);
};

const getServiceType = (service: Service) => {
  return service.type?.cleaningType || service.type?.description || '-';
};

const getServiceCleaner = (service: Service) => {
  return service.user?.name || 'Unassigned';
};

const getServiceTotal = (service: Service) => {
  if (service.total !== undefined && service.total !== null) {
    return Number(service.total).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  const typePrice = Number(service.type?.price || 0);
  const extrasPrice = service.extrasByServices?.reduce((total, item) => {
    return total + Number(item.extra?.itemPrice || 0);
  }, 0) || 0;

  return (typePrice + extrasPrice).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const getShortComment = (comment?: string | null) => {
  if (!comment) return '-';
  return comment.length > 56 ? `${comment.slice(0, 56)}...` : comment;
};

const validateRange = () => {
  if (!rangeStartDate.value || !rangeEndDate.value) {
    showToast(toast, { severity: 'warn', summary: 'Select a start and end date.' });
    return false;
  }

  if (rangeStartDate.value > rangeEndDate.value) {
    showToast(toast, { severity: 'warn', summary: 'Start date must be before end date.' });
    return false;
  }

  return true;
};

const fetchRangeServices = async () => {
  if (!validateRange()) return;

  isLoadingRange.value = true;
  hasSearchedRange.value = true;

  try {
    rangeServices.value = await CleanersServices.getServicesByCommunityDateRange(
      currentCommunityId,
      formatDateParam(rangeStartDate.value!),
      formatDateParam(rangeEndDate.value!)
    );
  } catch (error) {
    rangeServices.value = [];
    showToast(toast, { severity: 'error', summary: 'Unable to load services.' });
  } finally {
    isLoadingRange.value = false;
  }
};

const openMassiveDeleteDialog = () => {
  if (!rangeServiceCount.value) {
    showToast(toast, { severity: 'warn', summary: 'There are no services to delete.' });
    return;
  }

  showDeleteDialog.value = true;
};

const deleteRangeServices = async () => {
  if (!validateRange()) return;

  isDeletingRange.value = true;

  try {
    const result = await CleanersServices.deleteServicesByCommunityDateRange(
      currentCommunityId,
      formatDateParam(rangeStartDate.value!),
      formatDateParam(rangeEndDate.value!)
    );
    rangeServices.value = [];
    showDeleteDialog.value = false;
    showToast(toast, {
      severity: 'success',
      summary: 'Services deleted',
      detail: `${result.deletedCount} services were deleted.`,
    });
  } catch (error) {
    showToast(toast, { severity: 'error', summary: 'Services were not deleted.' });
  } finally {
    isDeletingRange.value = false;
  }
};

const updateEntity = async (id: string, data: any) => {
  // Encontrar el manager y supervisor seleccionados
  const selectedUsers = entityData.value.userId.map(id => 
    managers.value.data.find(u => u.id === id)
  ).filter(user => user) as User[];

  const manager = selectedUsers.find(user => user.role.id === "3");
  const supervisor = selectedUsers.find(user => user.role.id === "6");

  // Validate required fields
  if (!data.communityName?.trim()) {
    throw new Error('Community name is required');
  }

  if (!data.companyId) {
    throw new Error('Company ID is required');
  }

  const updateData = {
    communityName: data.communityName,
    companyId: data.companyId,
    id: id,
    managerUserId: manager?.id || null,
    supervisorUserId: supervisor?.id || null
  };
  try {
    await CommunitiesServices.updateCommunity(id, updateData);
  } catch (error: any) {
    console.error('Update error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};
</script>

<template>
  <GenericEditForm :breadcrumb-routes="breadcrumbRoutes" view-title="Edit Community" :inputs="inputs"
    :load-data="loadData" :update-entity="updateEntity" :initial-data="{ communityName: '', companyId: '' }"
    :key-value-map="keyValueMap">
    <template #additional-fields>
      <fieldset>
        <label for="managers">Managers y Supervisores</label>
        <div class="flex flex-col gap-2">
          <MultiSelect 
            v-model="entityData.userId" 
            :options="formattedManagers" 
            optionLabel="formattedName"
            optionValue="id" 
            placeholder="Seleccionar managers y supervisores" 
            class="w-full md:w-80" 
            :filter="true"
            @change="handleUserSelection" 
          />
          
          <!-- Información de usuarios seleccionados -->
          <div class="text-sm mt-2">
            <div class="flex items-center gap-2">
              <span class="font-medium">Manager:</span>
              <span v-if="selectedUsersInfo.manager" class="text-blue-600">
                {{ selectedUsersInfo.manager.name }}
              </span>
              <span v-else class="text-gray-500 italic">
                No hay manager asignado
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-medium">Supervisor:</span>
              <span v-if="selectedUsersInfo.supervisor" class="text-green-600">
                {{ selectedUsersInfo.supervisor.name }}
              </span>
              <span v-else class="text-gray-500 italic">
                No hay supervisor asignado
              </span>
            </div>
          </div>
        </div>
      </fieldset>
      <fieldset class="community-services-panel">
        <div class="range-header">
          <div>
            <label class="range-title">Services in this community</label>
            <p class="range-subtitle">Review services by date range before deleting them.</p>
          </div>
          <span class="range-count">{{ rangeServiceCount }} services found</span>
        </div>

        <div class="range-controls">
          <div class="range-field">
            <label for="rangeStartDate">Start date</label>
            <Calendar
              id="rangeStartDate"
              v-model="rangeStartDate"
              dateFormat="mm-dd-yy"
              showIcon
              class="w-full"
            />
          </div>
          <div class="range-field">
            <label for="rangeEndDate">End date</label>
            <Calendar
              id="rangeEndDate"
              v-model="rangeEndDate"
              dateFormat="mm-dd-yy"
              showIcon
              class="w-full"
            />
          </div>
          <div class="range-actions">
            <Button
              type="button"
              label="Load services"
              icon="pi pi-search"
              :loading="isLoadingRange"
              @click="fetchRangeServices"
            />
            <Button
              type="button"
              label="Massive delete"
              icon="pi pi-trash"
              severity="danger"
              :disabled="!rangeServiceCount || isLoadingRange"
              @click="openMassiveDeleteDialog"
            />
          </div>
        </div>

        <DataTable
          :value="rangeServices"
          :loading="isLoadingRange"
          dataKey="id"
          paginator
          :rows="10"
          :rowsPerPageOptions="[10, 25, 50]"
          responsiveLayout="scroll"
          tableStyle="min-width: 62rem"
          stripedRows
          class="range-table"
        >
          <template #empty>
            <div class="empty-range">
              {{ hasSearchedRange ? 'No services found for this range.' : 'Select a date range to load services.' }}
            </div>
          </template>

          <Column field="date" header="Date" sortable>
            <template #body="{ data }">{{ formatDisplayDate(data.date) }}</template>
          </Column>
          <Column field="schedule" header="Time">
            <template #body="{ data }">{{ formatSchedule(data.schedule) }}</template>
          </Column>
          <Column field="unitNumber" header="Unit" sortable></Column>
          <Column header="Type">
            <template #body="{ data }">{{ getServiceType(data) }}</template>
          </Column>
          <Column header="Status">
            <template #body="{ data }">
              <span class="status-pill">{{ data.status?.statusName || '-' }}</span>
            </template>
          </Column>
          <Column header="Cleaner">
            <template #body="{ data }">{{ getServiceCleaner(data) }}</template>
          </Column>
          <Column header="Total">
            <template #body="{ data }">{{ getServiceTotal(data) }}</template>
          </Column>
          <Column header="Comment">
            <template #body="{ data }">{{ getShortComment(data.comment || data.userComment) }}</template>
          </Column>
        </DataTable>
      </fieldset>

      <Dialog
        v-model:visible="showDeleteDialog"
        modal
        header="Confirm massive delete"
        :style="{ width: 'min(92vw, 32rem)' }"
      >
        <p class="dialog-copy">
          Are you sure you want to delete {{ rangeServiceCount }} services from {{ rangeLabel }}?
        </p>
        <template #footer>
          <Button type="button" label="Cancel" severity="secondary" variant="text" @click="showDeleteDialog = false" />
          <Button
            type="button"
            label="Yes, delete"
            icon="pi pi-trash"
            severity="danger"
            :loading="isDeletingRange"
            @click="deleteRangeServices"
          />
        </template>
      </Dialog>
    </template>
  </GenericEditForm>
</template>

<style scoped>
.community-services-panel {
  grid-column: 1 / -1;
  border: 1px solid var(--p-surface-200);
  border-radius: 8px;
  padding: 1rem;
}

.range-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.range-title {
  display: block;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.range-subtitle {
  color: var(--p-surface-500);
  margin: 0;
}

.range-count {
  background: var(--p-surface-100);
  border-radius: 999px;
  color: var(--p-surface-700);
  font-weight: 700;
  padding: 0.35rem 0.7rem;
  white-space: nowrap;
}

.range-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(12rem, 1fr)) auto;
  gap: 1rem;
  align-items: end;
  margin-bottom: 1rem;
}

.range-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.range-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.range-table {
  overflow: hidden;
}

.status-pill {
  background: var(--p-primary-50);
  border-radius: 999px;
  color: var(--p-primary-700);
  display: inline-flex;
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  white-space: nowrap;
}

.empty-range {
  color: var(--p-surface-500);
  padding: 1.5rem 0;
  text-align: center;
}

.dialog-copy {
  line-height: 1.5;
  margin: 0;
}

@media (max-width: 900px) {
  .range-header,
  .range-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .range-controls {
    grid-template-columns: 1fr;
  }
}
</style>
