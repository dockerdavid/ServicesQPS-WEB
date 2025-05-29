<script setup lang="ts">
import { useRoute } from 'vue-router';
import { CommunitiesServices } from './communities.services';
import { UsersServices } from '../users/users.services';
import { CompaniesServices } from '../companies/companies.services';
import GenericEditForm from '../shared/views/GenericEditForm.vue';
import type { InputConfig } from '../../interfaces/input-config.interface';
import { MultiSelect } from 'primevue';
import { ref, onMounted, computed } from 'vue';
import type { User } from '../../interfaces/users/users.interface';
import type { Community, NewCommunity } from '../../interfaces/communities/communities.interface';

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
const currentCommunityId = route.params.id as string;
const managers = ref<{ data: User[] }>({ data: [] });
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
    </template>
  </GenericEditForm>
</template>