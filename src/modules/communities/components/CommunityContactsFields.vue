<script setup lang="ts">
import { InputSwitch, InputText } from 'primevue';
import type { CommunityContacts } from '../../../interfaces/communities/communities.interface';

/** Contactos del complex (supervisor de mantenimiento, técnico y manager).
 *  El cleaner los ve en el servicio de la app, con tap para llamar, solo si
 *  `showContactsInApp` está activo. */
const contacts = defineModel<CommunityContacts>({ required: true });

type ContactTextField = Exclude<keyof CommunityContacts, 'showContactsInApp'>;

const rows: { label: string; name: ContactTextField; phone: ContactTextField }[] = [
  { label: 'Supervisor de mantenimiento', name: 'maintenanceSupervisorName', phone: 'maintenanceSupervisorPhone' },
  { label: 'Técnico', name: 'technicianName', phone: 'technicianPhone' },
  { label: 'Manager', name: 'managerContactName', phone: 'managerContactPhone' },
];
</script>

<template>
  <fieldset class="community-contacts">
    <label>Contactos del complex
      <small class="text-gray-400">(el cleaner puede llamarlos desde el servicio en la app)</small>
    </label>

    <div v-for="row in rows" :key="row.name" class="community-contacts__row">
      <span class="community-contacts__role">{{ row.label }}</span>
      <InputText
        :id="row.name"
        v-model="contacts[row.name]"
        placeholder="Nombre"
        maxlength="120"
      />
      <InputText
        :id="row.phone"
        v-model="contacts[row.phone]"
        placeholder="Teléfono"
        type="tel"
        maxlength="30"
      />
    </div>

    <div class="community-contacts__toggle">
      <InputSwitch inputId="showContactsInApp" v-model="contacts.showContactsInApp" />
      <label for="showContactsInApp">Mostrar contactos en la app
        <strong>{{ contacts.showContactsInApp ? 'Sí' : 'No' }}</strong>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.community-contacts {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.community-contacts__row {
  display: grid;
  grid-template-columns: 14rem minmax(10rem, 1fr) minmax(9rem, 14rem);
  gap: 0.5rem;
  align-items: center;
}

.community-contacts__role {
  font-weight: 600;
  color: var(--p-surface-700);
}

.community-contacts__toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

@media (max-width: 700px) {
  .community-contacts__row {
    grid-template-columns: 1fr;
  }
}
</style>
