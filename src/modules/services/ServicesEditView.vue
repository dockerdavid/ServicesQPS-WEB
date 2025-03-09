<script setup lang="ts">
import { useRoute } from 'vue-router';
import { CommunitiesServices } from '../communities/communities.services';
import { TypesServices } from '../types/types.services';
import { StatusesServices } from '../statuses/statuses.services';
import { ExtrasServices } from '../extras/extras.services';
import { UsersServices } from '../users/users.services';
import { CleanersServices } from './services.services';
import GenericEditForm from '../shared/views/GenericEditForm.vue';
import moment from 'moment';
import type { InputConfig } from '@/interfaces/input-config.interface';

const route = useRoute();
const serviceId = route.params.id as string;

const breadcrumbRoutes = [
  { label: 'Services', to: { name: 'services-default' } },
  { label: 'Edit', to: { name: 'services-edit' } },
];

const inputs: InputConfig[] = [
  { label: 'Date', inputId: 'date', inputType: 'datepicker', icon: 'calendar' },
  { label: 'Schedule', inputId: 'schedule', inputType: 'datepicker', icon: 'clock', hourFormat: true, timeOnly: true },
  { label: 'Unit size', inputId: 'unitySize', inputType: 'select', options: [] },
  { label: 'Unit number', inputId: 'unitNumber', inputType: 'numeric', inputNumericMode: 'decimal', icon: 'address-book' },
  { label: 'Community', inputId: 'communityId', inputType: 'select', options: [] },
  { label: 'Type', inputId: 'typeId', inputType: 'select', options: [] },
  { label: 'Status', inputId: 'statusId', inputType: 'select', options: [] },
  { label: 'Extras', inputId: 'extraId', inputType: 'select', options: [] },
  { label: 'Cleaner', inputId: 'userId', inputType: 'select', options: [] },
  { label: 'Comment', inputId: 'comment', inputType: 'input' },
];

const unitSizeOptions = [
  { label: 'N/A', value: 'N/A' },
  { label: '1 Bedroom', value: '1 Bedroom' },
  { label: '2 Bedroom', value: '2 Bedroom' },
  { label: '3 Bedroom', value: '3 Bedroom' },
  { label: '4 Bedroom', value: '4 Bedroom' },
  { label: '5 Bedroom', value: '5 Bedroom' },
];

const keyValueMap = {
  communityId: 'community.id', // Mapea communityId a community.id
  typeId: 'type.id', // Mapea typeId a type.id
  statusId: 'status.id', // Mapea statusId a status.id
  userId: 'user.id', // Mapea userId a user.id
  extraId: 'extra.id', // Mapea extraId a extra.id
};

const loadData = async (id: string) => {
  const [communityResults, typeResults, statusResults, extrasResults, usersResult, serviceResult] = await Promise.all([
    CommunitiesServices.getCommunities(),
    TypesServices.getTypes(),
    StatusesServices.getStatuses(),
    ExtrasServices.getExtras(),
    UsersServices.getUsers(undefined, 50),
    CleanersServices.getServiceById(id),
  ]);

  return {
    ...serviceResult,
    unitySizeOptions: unitSizeOptions,
    communityIdOptions: communityResults.data.map((community) => ({
      label: community.communityName,
      value: community.id,
    })),
    typeIdOptions: typeResults.data.map((type) => ({
      label: `${type.cleaningType} (${type.description})`,
      value: type.id,
    })),
    statusIdOptions: statusResults.data.map((status) => ({
      label: status.statusName,
      value: status.id,
    })),
    extraIdOptions: extrasResults.data.map((extra) => ({
      label: extra.item,
      value: extra.id,
    })),
    userIdOptions: usersResult.data.map((user) => ({
      label: user.name,
      value: user.id,
    })),
  };
};


const updateEntity = async (id: string, data: any) => {
  await CleanersServices.updateService(id, data);
};
</script>

<template>
  <GenericEditForm :breadcrumb-routes="breadcrumbRoutes" view-title="Edit Service" :inputs="inputs"
    :load-data="loadData" :update-entity="updateEntity" :initial-data="{
      date: moment().format('YYYY-MM-DD'),
      schedule: moment().format('HH:mm:ss'),
      comment: '',
      communityId: '',
      extraId: '',
      statusId: '',
      typeId: '',
      unitNumber: '',
      unitySize: '',
      userComment: '',
      userId: '',
    }" :key-value-map="keyValueMap" />
</template>