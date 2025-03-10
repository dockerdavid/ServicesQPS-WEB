<script setup lang="ts">
import { useRoute } from 'vue-router';
import { CommunitiesServices } from '../communities/communities.services';
import { TypesServices } from '../types/types.services';
import { StatusesServices } from '../statuses/statuses.services';
import { ExtrasServices } from '../extras/extras.services';
import { UsersServices } from '../users/users.services';
import { CleanersServices } from './services.services';
import moment from 'moment';
import MyInputGroup from '../shared/components/MyInputGroup.vue';
import LoadingButton from '../shared/components/LoadingButton.vue';
import { Breadcrumb, useToast, DatePicker, MultiSelect } from 'primevue';
import { computed, onMounted, ref, watch } from 'vue';
import { showToast } from '../../utils/show-toast';
import type { Communities } from '../../interfaces/communities/communities.interface';
import type { EditService, Service, TypeByCommunity } from '../../interfaces/services/services.interface';
import type { Statuses } from '../../interfaces/statuses/statuses.interface';
import type { Extras } from '../../interfaces/extras/extras.interface';
import type { Users } from '../../interfaces/users/users.interface';
import genericNullObject from '../../utils/null-data-meta';

const toast = useToast();
const route = useRoute();
const entityId = route.params.id as string;

const breadcrumbRoutes = [
  { label: 'Services', to: { name: 'services-default' } },
  { label: 'Edit', to: { name: 'services-edit' } },
];


const fillInitialData = (service: Service) => {
  updatedService.value = {
    date: service.date,
    schedule: moment(`${service.date}T${service.schedule}`).toDate(),
    comment: service.comment || '',
    communityId: service.communityId,
    extraId: service.extrasByServices.map(extra => extra.extraId),
    statusId: service.statusId,
    typeId: service.typeId,
    unitNumber: service.unitNumber,
    unitySize: service.unitySize,
    userComment: service.userComment || '',
    userId: service.userId || '',
  }
}

const updatedService = ref<EditService>({
  date: moment().format('YYYY-MM-DD'),
  schedule: moment().toDate(),
  comment: '',
  communityId: '',
  extraId: [],
  statusId: '',
  typeId: '',
  unitNumber: '',
  unitySize: '',
  userComment: '',
  userId: '',
});

const communities = ref<Communities>(genericNullObject);
const typesByCommunity = ref<TypeByCommunity[]>([]);
const statuses = ref<Statuses>(genericNullObject);
const extras = ref<Extras>(genericNullObject);
const cleaners = ref<Users>(genericNullObject);

const communityOptions = computed(() => {
  return communities.value.data.map((community) => {
    return {
      label: community.communityName,
      value: community.id,
    };
  });
});

const typeOptions = computed(() => {
  return typesByCommunity.value.map((type: TypeByCommunity) => {
    return {
      label: `${type.cleaningType} (${type.description})`,
      value: type.id,
    };
  });
});

const statusOptions = computed(() => {
  return statuses.value.data.map((status) => {
    return {
      label: status.statusName,
      value: status.id,
    };
  });
});

const extrasOptions = computed(() => {
  return extras.value.data.map((extra) => {
    return {
      label: extra.item,
      value: extra.id,
    };
  });
});

const cleanerOptions = computed(() => {
  return cleaners.value.data.map((cleaner) => {
    return {
      label: cleaner.name,
      value: cleaner.id,
    };
  });
});

const unitSizeOptions = [
  { label: 'N/A', value: 'N/A' },
  { label: '1 Bedroom', value: '1 Bedroom' },
  { label: '2 Bedroom', value: '2 Bedroom' },
  { label: '3 Bedroom', value: '3 Bedroom' },
  { label: '4 Bedroom', value: '4 Bedroom' },
  { label: '5 Bedroom', value: '5 Bedroom' },
];

const getTypesByCommunity = async () => {
  if (updatedService.value.communityId) {
    const types = await TypesServices.getTypesByCommunity(updatedService.value.communityId);
    typesByCommunity.value = types;
  }
};

watch(() => updatedService.value.communityId, (newCommunityId) => {
  if (newCommunityId) {
    getTypesByCommunity();
  }
});

const updateService = async () => {
  updatedService.value.unitNumber = updatedService.value.unitNumber.toString();
  try {
    await CleanersServices.updateService(entityId, updatedService.value);
    showToast(toast, { severity: 'success', detail: 'Service was updated' });
    updatedService.value = {
      date: moment().format('YYYY-MM-DD'),
      schedule: moment().toDate(),
      comment: '',
      communityId: '',
      extraId: [],
      statusId: '',
      typeId: '',
      unitNumber: '',
      unitySize: '',
      userComment: '',
      userId: '',

    };
  } catch (error) {
    showToast(toast, { severity: 'error', summary: "Service wasn't updated" });
  }
};

onMounted(async () => {
  const [communityResults, statusResults, extrasResults, cleanerResults, initialData] = await Promise.all([
    CommunitiesServices.getCommunities(),
    StatusesServices.getStatuses(),
    ExtrasServices.getExtras(),
    UsersServices.getUsers(),
    CleanersServices.getServiceById(entityId)
  ]);

  communities.value = communityResults;
  statuses.value = statusResults;
  extras.value = extrasResults;
  cleaners.value = cleanerResults;
  fillInitialData(initialData)

});


</script>

<template>

  <div class="py-6">

    <Breadcrumb :model="breadcrumbRoutes">
      <template #item="{ item, props }">
        <router-link v-if="item.to" v-slot="{ href, navigate }" :to="item.to" custom>
          <a :href="href" v-bind="props.action" @click="navigate">
            <span :class="[item.icon, 'text-color']" />
            <span class="text-primary font-semibold">{{ item.label }}</span>
          </a>
        </router-link>
        <a v-else :href="item.url" :target="item.target" v-bind="props.action">
          <span class="text-surface-700 dark:text-surface-0">{{ item.label }}</span>
        </a>
      </template>
    </Breadcrumb>


    <h1 class="text-3xl">
      Edit service
    </h1>
  </div>

  <form class="form-grid">

    <MyInputGroup v-model="updatedService.date" label="Date" input-type="datepicker" input-id="date" />
    <fieldset>

      <label for="schedule">Schedule</label>
      <DatePicker v-model="updatedService.schedule" label="Schedule" input-type="datepicker" input-id="schedule"
        :time-only="true" hour-format="12" />

    </fieldset>
    <MyInputGroup :options="unitSizeOptions" v-model="updatedService.unitySize" label="Unit size" input-type="select"
      input-id="unit-size" />
    <MyInputGroup v-model="updatedService.unitNumber" label="Unit number" input-type="input" input-id="unit-number" />
    <MyInputGroup :options="communityOptions" v-model="updatedService.communityId" label="Community" input-type="select"
      input-id="community" />
    <MyInputGroup :options="typeOptions" v-model="updatedService.typeId" label="Type" input-type="select"
      input-id="type" />
    <MyInputGroup :options="statusOptions" v-model="updatedService.statusId" label="Status" input-type="select"
      input-id="status" />

    <fieldset>
      <label for="extras">Extras</label>
      <MultiSelect input-id="extras" v-model="updatedService.extraId" :options="extrasOptions" optionLabel="label"
        optionValue="value" filter placeholder="Select Extras" :maxSelectedLabels="3" class="w-full md:w-80" />
    </fieldset>

    <MyInputGroup :options="cleanerOptions" v-model="updatedService.userId" label="Cleaner" input-type="select"
      input-id="cleaner" />
    <MyInputGroup v-model="updatedService.comment" label="Comment" input-type="input" input-id="comment" />

  </form>
  <LoadingButton label="Edit" @click="updateService"></LoadingButton>

</template>


<style scoped lang="scss">
.form-grid {

  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}


@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    grid-auto-flow: dense;
  }
}
</style>