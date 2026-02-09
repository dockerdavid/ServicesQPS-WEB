<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import moment from 'moment';
import { DatePicker, MultiSelect, Select, useToast } from 'primevue';
import CreateLayout from '../../layouts/CreateLayout.vue';
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import LoadingButton from '../shared/components/LoadingButton.vue';
import { showToast } from '../../utils/show-toast';
import { CommunitiesServices } from '../communities/communities.services';
import { TypesServices } from '../types/types.services';
import { StatusesServices } from '../statuses/statuses.services';
import { ExtrasServices } from '../extras/extras.services';
import { UsersServices } from '../users/users.services';
import { RecurringServicesServices } from './recurring-services.services';
import type { TypeByCommunity } from '../../interfaces/services/services.interface';
import type { Community } from '../../../src/interfaces/communities/communities.interface';
import type { Statuses } from '../../../src/interfaces/statuses/statuses.interface';
import type { Extras } from '../../../src/interfaces/extras/extras.interface';
import type { Users } from '../../../src/interfaces/users/users.interface';
import type { NewRecurringService } from '../../interfaces/recurring-services/recurring-services.interface';
import genericNullObject from '../../../src/utils/null-data-meta';
import router from '../../../src/router';
import { useUserStore } from '../../../src/store/user.store';

const toast = useToast();
const userStore = useUserStore();

const breadcrumbRoutes = [
  { label: 'Recurring Services', to: { name: 'recurring-services-default' } },
  { label: 'Create', to: { name: 'recurring-services-create' } },
];

const dayOptions = [
  { label: 'Mon', value: 'mon' },
  { label: 'Tue', value: 'tue' },
  { label: 'Wed', value: 'wed' },
  { label: 'Thu', value: 'thu' },
  { label: 'Fri', value: 'fri' },
  { label: 'Sat', value: 'sat' },
  { label: 'Sun', value: 'sun' },
];

const unitSizeOptions = [
  { label: 'N/A', value: 'N/A' },
  { label: '1 Bedroom', value: '1 Bedroom' },
  { label: '2 Bedroom', value: '2 Bedroom' },
  { label: '3 Bedroom', value: '3 Bedroom' },
  { label: '4 Bedroom', value: '4 Bedroom' },
  { label: '5 Bedroom', value: '5 Bedroom' },
];

const newRecurring = ref<NewRecurringService>({
  communityId: '',
  typeId: '',
  statusId: '',
  unitySize: '',
  unitNumber: '',
  schedule: '00:00:00',
  comment: '',
  userComment: '',
  userId: '',
  daysOfWeek: [],
  extraIds: [],
  isActive: true,
});

const scheduleDate = ref<Date>(moment('00:00:00', 'HH:mm:ss').toDate());
const isFormSubmitted = ref(false);

const communities = ref<Community[]>([]);
const typesByCommunity = ref<TypeByCommunity[]>([]);
const statuses = ref<Statuses>({ data: [], meta: genericNullObject.meta });
const extras = ref<Extras>({ data: [], meta: genericNullObject.meta });
const cleaners = ref<Users>({ data: [], meta: genericNullObject.meta });
const activeAssigneeIds = ref<Set<string>>(new Set());
const assigneeOptions = ref<{ label: string; value: string }[]>([]);

const nextWeekStartLabel = computed(() =>
  moment().startOf('isoWeek').add(1, 'week').format('MM/DD/YYYY'),
);

const getAllCommunities = async () => {
  let allCommunities: any[] = [];
  let currentPage = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await CommunitiesServices.getCommunities(currentPage, 50);
    allCommunities = [...allCommunities, ...response.data];
    hasNextPage = response.meta.hasNextPage;
    currentPage++;
  }

  return {
    data: allCommunities,
    meta: {
      page: 1,
      take: allCommunities.length,
      totalCount: allCommunities.length,
      pageCount: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  };
};

const getAllStatuses = async () => {
  let allStatuses: any[] = [];
  let currentPage = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await StatusesServices.getStatuses(currentPage, 50);
    allStatuses = [...allStatuses, ...response.data];
    hasNextPage = response.meta.hasNextPage;
    currentPage++;
  }

  return {
    data: allStatuses,
    meta: {
      page: 1,
      take: allStatuses.length,
      totalCount: allStatuses.length,
      pageCount: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  };
};

const getAllExtras = async () => {
  let allExtras: any[] = [];
  let currentPage = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await ExtrasServices.getExtras(currentPage, 50);
    allExtras = [...allExtras, ...response.data];
    hasNextPage = response.meta.hasNextPage;
    currentPage++;
  }

  return {
    data: allExtras,
    meta: {
      page: 1,
      take: allExtras.length,
      totalCount: allExtras.length,
      pageCount: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  };
};

const getAllUsers = async () => {
  let allUsers: any[] = [];
  let currentPage = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await UsersServices.getUsers(currentPage, 50);
    allUsers = [...allUsers, ...response.data];
    hasNextPage = response.meta.hasNextPage;
    currentPage++;
  }

  const cleanersOnly = allUsers.filter((user) => user.roleId === '4' || user.roleId === '7');

  return {
    data: cleanersOnly,
    meta: {
      page: 1,
      take: cleanersOnly.length,
      totalCount: cleanersOnly.length,
      pageCount: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  };
};

const getTypesByCommunity = async (communityId: string) => {
  if (communityId) {
    const types = await TypesServices.getTypesByCommunity(communityId);
    typesByCommunity.value = types;
  }
};

const loadOptions = async () => {
  const [allCommunities, allStatuses, allExtras, allUsers, activeIds] = await Promise.all([
    getAllCommunities(),
    getAllStatuses(),
    getAllExtras(),
    getAllUsers(),
    UsersServices.getActiveAssigneeIds(3),
  ]);

  communities.value = allCommunities.data.sort((a, b) =>
    a.communityName.localeCompare(b.communityName),
  );
  statuses.value = allStatuses;
  extras.value = allExtras;
  cleaners.value = allUsers;
  activeAssigneeIds.value = new Set(activeIds);
};

watch(
  () => [cleaners.value.data, activeAssigneeIds.value],
  () => {
    const activeSet = activeAssigneeIds.value;
    const sorted = [...cleaners.value.data].sort((a, b) => {
      const aActive = activeSet.has(a.id);
      const bActive = activeSet.has(b.id);
      if (aActive !== bActive) {
        return aActive ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    assigneeOptions.value = sorted.map((cleaner) => ({
      label: `${cleaner.name} (${activeSet.has(cleaner.id) ? 'active' : 'inactive'})`,
      value: cleaner.id,
    }));
  },
  { immediate: true, deep: true },
);

watch(
  () => newRecurring.value.communityId,
  (newCommunityId) => {
    if (newCommunityId) {
      getTypesByCommunity(newCommunityId);
    }
  },
);

watch(
  () => scheduleDate.value,
  (newScheduleDate) => {
    if (newScheduleDate) {
      newRecurring.value.schedule = moment(newScheduleDate).format('HH:mm:ss');
    }
  },
);

const createRecurringService = async (leave: boolean) => {
  isFormSubmitted.value = true;

  const requiredFields = [
    { field: newRecurring.value.communityId, label: 'Community' },
    { field: newRecurring.value.typeId, label: 'Type' },
    { field: newRecurring.value.statusId, label: 'Status' },
    { field: newRecurring.value.unitNumber, label: 'Unit number' },
    { field: newRecurring.value.unitySize, label: 'Unit size' },
    { field: newRecurring.value.daysOfWeek, label: 'Days of week' },
  ];

  const missingFields = requiredFields
    .filter((field) => !field.field || (Array.isArray(field.field) && field.field.length === 0))
    .map((field) => field.label);

  if (missingFields.length > 0) {
    showToast(toast, {
      severity: 'error',
      summary: 'Missing required fields',
      detail: `The following fields are required: ${missingFields.join(', ')}`,
    });
    return;
  }

  try {
    const payload = {
      ...newRecurring.value,
      unitNumber: newRecurring.value.unitNumber.toString(),
    } as NewRecurringService;

    if (!payload.userId) {
      delete payload.userId;
    }

    await RecurringServicesServices.createRecurringService(payload);
    showToast(toast, { severity: 'success', detail: 'Recurring service was created' });
    leave ? router.back() : clearForm();
  } catch (error) {
    showToast(toast, { severity: 'error', summary: "Recurring service wasn't created" });
  } finally {
    isFormSubmitted.value = false;
  }
};

const clearForm = () => {
  newRecurring.value = {
    communityId: '',
    typeId: '',
    statusId: '',
    unitySize: '',
    unitNumber: '',
    schedule: '00:00:00',
    comment: '',
    userComment: '',
    userId: '',
    daysOfWeek: [],
    extraIds: [],
    isActive: true,
  };
  scheduleDate.value = moment('00:00:00', 'HH:mm:ss').toDate();
  isFormSubmitted.value = false;
};

onMounted(async () => {
  await loadOptions();
});
</script>

<template>
  <CreateLayout :breadcrumb-routes="breadcrumbRoutes">
    <template #view-title>Recurring service</template>

    <template #inputs>
      <div class="info-banner">
        Starts next week: <strong>{{ nextWeekStartLabel }}</strong>
      </div>

      <fieldset>
        <label for="schedule">Schedule</label>
        <DatePicker v-model="scheduleDate" :time-only="true" hour-format="24" id="schedule" />
      </fieldset>

      <MyInputGroup
        v-model="newRecurring.unitySize"
        label="Unit size"
        inputId="unitySize"
        inputType="select"
        :options="unitSizeOptions"
        :is-form-submitted="isFormSubmitted"
      />

      <MyInputGroup
        v-model="newRecurring.unitNumber"
        label="Unit number"
        inputId="unitNumber"
        inputType="input"
        icon="address-book"
        :is-form-submitted="isFormSubmitted"
      />

      <MyInputGroup
        v-model="newRecurring.communityId"
        label="Community"
        inputId="communityId"
        inputType="select"
        :options="communities.map((c) => ({ label: c.communityName, value: c.id }))"
        :is-form-submitted="isFormSubmitted"
      />

      <MyInputGroup
        v-model="newRecurring.typeId"
        label="Type"
        inputId="typeId"
        inputType="select"
        :options="typesByCommunity.map((t) => ({ label: `${t.cleaningType} (${t.description})`, value: t.id }))"
        :is-form-submitted="isFormSubmitted"
      />

      <MyInputGroup
        v-model="newRecurring.statusId"
        label="Status"
        inputId="statusId"
        inputType="select"
        :options="statuses.data.map((s) => ({ label: s.statusName, value: s.id }))"
        :is-form-submitted="isFormSubmitted"
      />

      <fieldset>
        <label for="days">Days of week</label>
        <div class="days-grid">
          <label v-for="day in dayOptions" :key="day.value" class="day-option">
            <input type="checkbox" :value="day.value" v-model="newRecurring.daysOfWeek" />
            <span>{{ day.label }}</span>
          </label>
        </div>
        <small v-if="isFormSubmitted && newRecurring.daysOfWeek.length === 0" class="text-red-500">
          Field required
        </small>
      </fieldset>

      <fieldset>
        <label for="extras">Extras</label>
        <MultiSelect
          v-model="newRecurring.extraIds"
          :options="extras.data.map((e) => ({ label: e.item, value: e.id }))"
          optionLabel="label"
          optionValue="value"
          placeholder="Select extras"
          class="w-full md:w-80"
        />
      </fieldset>

      <MyInputGroup
        v-if="userStore.userData?.roleId === '1'"
        v-model="newRecurring.userId"
        label="Cleaner / QA"
        inputId="userId"
        inputType="select"
        :options="assigneeOptions"
        :required="false"
        :is-form-submitted="isFormSubmitted"
      />

      <MyInputGroup
        v-model="newRecurring.comment"
        label="Comment"
        inputId="comment"
        inputType="textarea"
        :required="false"
        :is-form-submitted="isFormSubmitted"
        :max-height="'150px'"
        :auto-resize="false"
      />

      <fieldset>
        <label for="isActive">Active</label>
        <Select
          v-model="newRecurring.isActive"
          inputId="isActive"
          :options="[
            { label: 'Active', value: true },
            { label: 'Inactive', value: false },
          ]"
          optionLabel="label"
          optionValue="value"
        />
      </fieldset>

      <div class="flex">
        <LoadingButton label="Create" @click="createRecurringService(false)" />
        <div class="px-4">
          <LoadingButton :outlined="true" label="Create and leave" @click="createRecurringService(true)" />
        </div>
        <LoadingButton severity="danger" :outlined="true" label="Clear form" @click="clearForm" />
      </div>
    </template>
  </CreateLayout>
</template>

<style scoped>
.info-banner {
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #0f172a;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.day-option {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
}
</style>
