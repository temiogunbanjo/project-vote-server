export enum Availability {
  STUDENTS = "STUDENTS",
  NONSTUDENTS = "NONSTUDENTS",
  EVERYONE = "EVERYONE",
}

class Category {
  name: string;
  description: string;
  eventId: string;
  availability: Availability;

  constructor(
    name: string,
    description: string,
    eventId: string,
    availability = Availability.STUDENTS
  ) {
    this.name = name;
    this.description = description;
    this.eventId = eventId;
    this.availability = availability;
  }
}

export default Category;
