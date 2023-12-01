import { prisma } from "./db.js";
import { addPaidVote, getEventDetails, checkCandidateCode } from "./functions/utilities.js";

const students = [
  {
    name: "Alice Smith",
    id: 1234567890,
  },
  {
    name: "Bob Jones",
    id: 9876543210,
  },
  {
    name: "Carol Williams",
    id: 9876543201,
  },
  {
    name: "Dave Brown",
    id: 2109876543,
  },
  {
    name: "Eve Johnson",
    id: 3210987654,
  },
  {
    name: "Frank Miller",
    id: 4321098765,
  },
  {
    name: "Grace Garcia",
    id: 5432109876,
  },
  {
    name: "Henry Davis",
    id: 6543210987,
  },
  {
    name: "Isabel Rodriguez",
    id: 7654321098,
  },
  {
    name: "James Walker",
    id: 8765432109,
  },
];

const schools = [
  "GH Media School",
  "GH Technology School",
  "GH Fashion School",
  "GH Cosmetology School",
  "GH Catering School",
];

const events = [
  {
    name: "Best Female Designs",
    school: "FASHION",
    availability: "STUDENTS",
    paymentType: "PAID",
    candidates: {
      create: [
        {
          fullname: "Kofi Appiah",
          code: 257,
          imageUrl:
            "https://cdn.glitch.global/f1913c87-30b3-4623-ba41-8eb1b6a1a637/dress.jpeg?v=1681906660218",
        },
        {
          fullname: "Janet Jackson",
          code: 634,
          imageUrl:
            "https://cdn.glitch.global/f1913c87-30b3-4623-ba41-8eb1b6a1a637/dress.jpeg?v=1681906660218",
        },
        {
          fullname: "Jack Robinson",
          code: 129,
          imageUrl:
            "https://cdn.glitch.global/f1913c87-30b3-4623-ba41-8eb1b6a1a637/dress.jpeg?v=1681906660218",
        },
      ],
    },
    pricePerVote: 1,
  },
  {
    name: "Best Male Clothing Made",
    school: "FASHION",
    availability: "NONSTUDENTS",
    paymentType: "PAID",
    candidates: {
      create: [
        {
          fullname: "Kofi Appiah",
          code: 876,
          imageUrl:
            "https://cdn.glitch.global/f1913c87-30b3-4623-ba41-8eb1b6a1a637/male-cloth.jpeg?1696519868760",
        },
        {
          fullname: "Janet Jackson",
          code: 402,
          imageUrl:
            "https://cdn.glitch.global/f1913c87-30b3-4623-ba41-8eb1b6a1a637/male-cloth.jpeg?1696519868760",
        },
        {
          fullname: "Jack Robinson",
          code: 543,
          imageUrl:
            "https://cdn.glitch.global/f1913c87-30b3-4623-ba41-8eb1b6a1a637/male-cloth.jpeg?1696519868760",
        },
      ],
    },
    pricePerVote: 1,
  },
  {
    name: "Best Ankara Designs",
    school: "FASHION",
    availability: "EVERYONE",
    paymentType: "PAID",
    candidates: {
      create: [
        {
          fullname: "Kofi Appiah",
          code: 718,
          imageUrl:
            "https://cdn.glitch.global/f1913c87-30b3-4623-ba41-8eb1b6a1a637/ankara.jpeg?1696520034489",
        },
        {
          fullname: "Janet Jackson",
          code: 365,
          imageUrl:
            "https://cdn.glitch.global/f1913c87-30b3-4623-ba41-8eb1b6a1a637/ankara.jpeg?1696520034489",
        },
        {
          fullname: "Jack Robinson",
          code: 951,
          imageUrl:
            "https://cdn.glitch.global/f1913c87-30b3-4623-ba41-8eb1b6a1a637/ankara.jpeg?1696520034489",
        },
      ],
    },
    pricePerVote: 1,
  },
];

const unpaidEvents = [
  {
    name: "Best Cake Designs",
    school: "CATERING",
    availability: "STUDENTS",
    paymentType: "UNPAID",
    candidates: {
      create: [
        {
          fullname: "Kofi Appiah",
          code: 284,
          imageUrl:
            "https://cdn.glitch.global/f1913c87-30b3-4623-ba41-8eb1b6a1a637/cake.jpeg?v=1681906662980",
        },
        {
          fullname: "Janet Jackson",
          code: 607,
          imageUrl:
            "https://cdn.glitch.global/f1913c87-30b3-4623-ba41-8eb1b6a1a637/cake.jpeg?v=1681906662980",
        },
        {
          fullname: "Jack Robinson",
          code: 743,
          imageUrl:
            "https://cdn.glitch.global/f1913c87-30b3-4623-ba41-8eb1b6a1a637/cake.jpeg?v=1681906662980",
        },
      ],
    },
    pricePerVote: 1,
  },
];

async function addStudents() {
  for (const student of students) {
    await prisma.students.create({
      data: student,
    });
  }
}

async function addSchools() {
  for (const school of schools) {
    await prisma.schoolNames.create({
      data: {
        name: school,
      },
    });
  }
}

async function addPaidEvents() {
  for (const event of events) {
    await prisma.events.create({
      data: event,
    });
  }
}

async function addUnpaidEvents() {
  for (const event of unpaidEvents) {
    await prisma.events.create({
      data: event,
    });
  }
}

async function checkIndexNumber(id) {
  let student = await prisma.students.findUnique({
    where: {
      id,
    },
  });

  if (student) {
    return student.name;
  }
  return null;
}

async function deletePayment(id) {
  await prisma.payments.delete({
    where: {
      id,
    },
  });
}

async function getEvents() {
  const events = await prisma.events.count({
    where: {
      ongoing: true,
    }
  })

  console.log(events)
}

async function updateEvents() {
  await prisma.events.updateMany({
    data: {
      ongoing: false
    }
  });
}

// addUnpaidEvents()
// addPaidEvents()
// addSchools();
// console.log(await checkCandidateCode("951", "BEST ANKARA DESIGNS"))

// addPaidVote(
//   1234567890,
//   "Kofi Appiah",
//   "Best Cake Designs",
//   "2349061868349",
//   10,
//   "ryxr8kfcla71xnn",
//   1000
// )

