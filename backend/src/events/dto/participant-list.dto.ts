export class ParticipantListItemDto {
  id!: string;
  name!: string;
  email!: string;
  eventName!: string;
  ticketType!: string;
  status!: string;
  registeredAt!: Date;
}

export class ParticipantFiltersDto {
  eventId?: string;
  search?: string;
  status?: string;
}
