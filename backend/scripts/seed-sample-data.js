const mongoose = require("mongoose");

const env = require("../src/config/env");
const connectToDatabase = require("../src/config/db");
const {
  Invoice,
  Product,
  Reservation,
  Room,
  Session,
  StockMovement,
  User
} = require("../src/models");

const SAMPLE_SEED_NOTE = "Sample seed data";
const RESET_FLAG = "--reset";

const createDate = ({ days = 0, hours = 0, minutes = 0 } = {}) =>
  new Date(Date.now() + (((days * 24 + hours) * 60) + minutes) * 60 * 1000);

const buildRoomSnapshot = (room) => ({
  roomId: room._id,
  code: room.code,
  name: room.name,
  type: room.type,
  hourlyRate: room.hourlyRate
});

const createOrderedItem = ({ product, quantity, addedAt }) => ({
  productId: product._id,
  productName: product.name,
  unitPrice: product.price,
  quantity,
  lineTotal: product.price * quantity,
  addedAt
});

const buildInvoiceLines = ({ session, roomCharge, durationMinutes }) => [
  {
    lineType: "room",
    referenceId: session.roomId,
    code: session.roomRateSnapshot.code,
    description: `${session.roomRateSnapshot.name} room charge`,
    quantity: durationMinutes,
    unitPrice: session.roomRateSnapshot.hourlyRate / 60,
    lineTotal: roomCharge
  },
  ...(session.orderedItems || []).map((item) => ({
    lineType: "product",
    referenceId: item.productId,
    code: "",
    description: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal
  }))
];

const getSeedUsers = async () => {
  const admin =
    (await User.findOne({ username: env.defaultAdmin.username.trim().toLowerCase() })) ||
    (await User.findOne({ role: "admin" }).sort({ createdAt: 1 }));
  const receptionist =
    (await User.findOne({ username: env.defaultReceptionist.username.trim().toLowerCase() })) ||
    (await User.findOne({ role: "receptionist" }).sort({ createdAt: 1 }));

  if (!admin || !receptionist) {
    throw new Error("Seed users are missing. Start the backend once or ensure default users can be created.");
  }

  return { admin, receptionist };
};

const resetSampleCollections = async () => {
  await Invoice.deleteMany({});
  await StockMovement.deleteMany({});
  await Session.deleteMany({});
  await Reservation.deleteMany({});
  await Room.deleteMany({});
  await Product.deleteMany({});
};

const ensureTargetCollectionsAreEmpty = async () => {
  const counts = await Promise.all([
    Room.estimatedDocumentCount(),
    Product.estimatedDocumentCount(),
    Reservation.estimatedDocumentCount(),
    Session.estimatedDocumentCount(),
    Invoice.estimatedDocumentCount(),
    StockMovement.estimatedDocumentCount()
  ]);

  const total = counts.reduce((sum, count) => sum + count, 0);

  if (total > 0) {
    throw new Error(
      "Sample seed aborted because business collections already contain data. Run `npm run seed:sample:reset` to replace it."
    );
  }
};

const createSampleDataset = async () => {
  const { admin, receptionist } = await getSeedUsers();

  const roomDocs = [
    {
      _id: new mongoose.Types.ObjectId(),
      code: "A101",
      name: "Room A101",
      type: "standard",
      capacity: 6,
      status: "available",
      hourlyRate: 300,
      isActive: true,
      notes: `${SAMPLE_SEED_NOTE}: available room`
    },
    {
      _id: new mongoose.Types.ObjectId(),
      code: "A102",
      name: "Room A102",
      type: "standard",
      capacity: 8,
      status: "reserved",
      hourlyRate: 300,
      isActive: true,
      notes: `${SAMPLE_SEED_NOTE}: upcoming reservation`
    },
    {
      _id: new mongoose.Types.ObjectId(),
      code: "B201",
      name: "Room B201",
      type: "standard",
      capacity: 10,
      status: "occupied",
      hourlyRate: 360,
      isActive: true,
      notes: `${SAMPLE_SEED_NOTE}: active walk-in`
    },
    {
      _id: new mongoose.Types.ObjectId(),
      code: "B202",
      name: "Room B202",
      type: "standard",
      capacity: 10,
      status: "occupied",
      hourlyRate: 360,
      isActive: true,
      notes: `${SAMPLE_SEED_NOTE}: active reservation session`
    },
    {
      _id: new mongoose.Types.ObjectId(),
      code: "C301",
      name: "VIP C301",
      type: "vip",
      capacity: 14,
      status: "cleaning",
      hourlyRate: 480,
      isActive: true,
      notes: `${SAMPLE_SEED_NOTE}: recently checked out`
    },
    {
      _id: new mongoose.Types.ObjectId(),
      code: "C302",
      name: "VIP C302",
      type: "vip",
      capacity: 16,
      status: "maintenance",
      hourlyRate: 420,
      isActive: true,
      notes: `${SAMPLE_SEED_NOTE}: under maintenance`
    },
    {
      _id: new mongoose.Types.ObjectId(),
      code: "D401",
      name: "Room D401",
      type: "standard",
      capacity: 8,
      status: "available",
      hourlyRate: 300,
      isActive: true,
      notes: `${SAMPLE_SEED_NOTE}: historical invoice data`
    }
  ];

  const rooms = Object.fromEntries(roomDocs.map((room) => [room.code, room]));

  const productDocs = [
    {
      _id: new mongoose.Types.ObjectId(),
      name: "Coca-Cola 330ml",
      category: "drink",
      price: 35,
      stockQty: 55,
      lowStockThreshold: 10,
      isActive: true
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: "Mineral Water 600ml",
      category: "drink",
      price: 25,
      stockQty: 38,
      lowStockThreshold: 8,
      isActive: true
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: "Potato Chips",
      category: "snack",
      price: 45,
      stockQty: 27,
      lowStockThreshold: 6,
      isActive: true
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: "Fried Rice",
      category: "food",
      price: 120,
      stockQty: 19,
      lowStockThreshold: 4,
      isActive: true
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: "Ice Bucket",
      category: "other",
      price: 20,
      stockQty: 10,
      lowStockThreshold: 3,
      isActive: true
    },
    {
      _id: new mongoose.Types.ObjectId(),
      name: "Seasonal Fruit Plate",
      category: "food",
      price: 90,
      stockQty: 11,
      lowStockThreshold: 2,
      isActive: true
    }
  ];

  const products = Object.fromEntries(productDocs.map((product) => [product.name, product]));

  const futureReservationTime = createDate({ hours: 4 });
  const checkedInOpenStart = createDate({ minutes: -45 });
  const closedReservationStart = createDate({ days: -2, hours: -3 });
  const closedReservationEnd = createDate({ days: -2, hours: -1, minutes: -30 });
  const closedWalkInStart = createDate({ days: -8, hours: -2 });
  const closedWalkInEnd = createDate({ days: -8, minutes: -20 });

  const reservationDocs = [
    {
      _id: new mongoose.Types.ObjectId(),
      roomId: rooms.A102._id,
      customerName: "Somchai Jaidee",
      customerPhone: "0812345678",
      reservedStartTime: futureReservationTime,
      expectedDuration: 120,
      depositAmount: 500,
      status: "confirmed",
      notes: `${SAMPLE_SEED_NOTE}: evening birthday booking`,
      roomSnapshot: buildRoomSnapshot(rooms.A102),
      reservedBy: receptionist._id
    },
    {
      _id: new mongoose.Types.ObjectId(),
      roomId: rooms.B202._id,
      customerName: "Nok Wanida",
      customerPhone: "0898765432",
      reservedStartTime: createDate({ hours: -1 }),
      expectedDuration: 180,
      depositAmount: 800,
      status: "checked_in",
      notes: `${SAMPLE_SEED_NOTE}: checked in and active`,
      roomSnapshot: buildRoomSnapshot(rooms.B202),
      reservedBy: receptionist._id,
      checkedInAt: checkedInOpenStart
    },
    {
      _id: new mongoose.Types.ObjectId(),
      roomId: rooms.C301._id,
      customerName: "Anan P.",
      customerPhone: "0820001111",
      reservedStartTime: closedReservationStart,
      expectedDuration: 150,
      depositAmount: 1000,
      status: "checked_in",
      notes: `${SAMPLE_SEED_NOTE}: completed VIP booking`,
      roomSnapshot: buildRoomSnapshot(rooms.C301),
      reservedBy: admin._id,
      checkedInAt: closedReservationStart
    },
    {
      _id: new mongoose.Types.ObjectId(),
      roomId: rooms.D401._id,
      customerName: "Mali K.",
      customerPhone: "0841234567",
      reservedStartTime: createDate({ days: 1, hours: 2 }),
      expectedDuration: 90,
      depositAmount: 300,
      status: "cancelled",
      notes: `${SAMPLE_SEED_NOTE}: cancelled reservation`,
      roomSnapshot: buildRoomSnapshot(rooms.D401),
      reservedBy: receptionist._id
    }
  ];

  const reservations = {
    futureConfirmed: reservationDocs[0],
    checkedInOpen: reservationDocs[1],
    checkedInClosed: reservationDocs[2],
    cancelled: reservationDocs[3]
  };

  const openWalkInItems = [
    createOrderedItem({ product: products["Coca-Cola 330ml"], quantity: 2, addedAt: createDate({ minutes: -30 }) }),
    createOrderedItem({ product: products["Potato Chips"], quantity: 1, addedAt: createDate({ minutes: -25 }) })
  ];
  const openReservationItems = [
    createOrderedItem({ product: products["Mineral Water 600ml"], quantity: 2, addedAt: createDate({ minutes: -20 }) }),
    createOrderedItem({ product: products["Fried Rice"], quantity: 1, addedAt: createDate({ minutes: -18 }) })
  ];
  const closedReservationItems = [
    createOrderedItem({ product: products["Coca-Cola 330ml"], quantity: 3, addedAt: createDate({ days: -2, hours: -2 }) }),
    createOrderedItem({ product: products["Seasonal Fruit Plate"], quantity: 1, addedAt: createDate({ days: -2, hours: -2, minutes: 10 }) })
  ];
  const closedWalkInItems = [
    createOrderedItem({ product: products["Ice Bucket"], quantity: 5, addedAt: createDate({ days: -8, hours: -1 }) }),
    createOrderedItem({ product: products["Potato Chips"], quantity: 2, addedAt: createDate({ days: -8, hours: -1, minutes: 10 }) })
  ];

  const sessionDocs = [
    {
      _id: new mongoose.Types.ObjectId(),
      roomId: rooms.B201._id,
      reservationId: null,
      customerName: "Walk-in Team Alpha",
      customerPhone: "0800001001",
      status: "open",
      startTime: createDate({ hours: -2 }),
      endTime: null,
      roomRateSnapshot: buildRoomSnapshot(rooms.B201),
      orderedItems: openWalkInItems,
      itemsSubtotal: openWalkInItems.reduce((sum, item) => sum + item.lineTotal, 0),
      totalAmount: openWalkInItems.reduce((sum, item) => sum + item.lineTotal, 0),
      notes: `${SAMPLE_SEED_NOTE}: active walk-in session`,
      openedBy: receptionist._id,
      closedBy: null,
      invoiceId: null
    },
    {
      _id: new mongoose.Types.ObjectId(),
      roomId: rooms.B202._id,
      reservationId: reservations.checkedInOpen._id,
      customerName: reservations.checkedInOpen.customerName,
      customerPhone: reservations.checkedInOpen.customerPhone,
      status: "open",
      startTime: checkedInOpenStart,
      endTime: null,
      roomRateSnapshot: reservations.checkedInOpen.roomSnapshot,
      orderedItems: openReservationItems,
      itemsSubtotal: openReservationItems.reduce((sum, item) => sum + item.lineTotal, 0),
      totalAmount: openReservationItems.reduce((sum, item) => sum + item.lineTotal, 0),
      notes: `${SAMPLE_SEED_NOTE}: active session from reservation`,
      openedBy: receptionist._id,
      closedBy: null,
      invoiceId: null
    },
    {
      _id: new mongoose.Types.ObjectId(),
      roomId: rooms.C301._id,
      reservationId: reservations.checkedInClosed._id,
      customerName: reservations.checkedInClosed.customerName,
      customerPhone: reservations.checkedInClosed.customerPhone,
      status: "closed",
      startTime: closedReservationStart,
      endTime: closedReservationEnd,
      roomRateSnapshot: reservations.checkedInClosed.roomSnapshot,
      orderedItems: closedReservationItems,
      itemsSubtotal: closedReservationItems.reduce((sum, item) => sum + item.lineTotal, 0),
      totalAmount: closedReservationItems.reduce((sum, item) => sum + item.lineTotal, 0),
      notes: `${SAMPLE_SEED_NOTE}: closed VIP session`,
      openedBy: admin._id,
      closedBy: receptionist._id
    },
    {
      _id: new mongoose.Types.ObjectId(),
      roomId: rooms.D401._id,
      reservationId: null,
      customerName: "Walk-in Team Beta",
      customerPhone: "0800002002",
      status: "closed",
      startTime: closedWalkInStart,
      endTime: closedWalkInEnd,
      roomRateSnapshot: buildRoomSnapshot(rooms.D401),
      orderedItems: closedWalkInItems,
      itemsSubtotal: closedWalkInItems.reduce((sum, item) => sum + item.lineTotal, 0),
      totalAmount: closedWalkInItems.reduce((sum, item) => sum + item.lineTotal, 0),
      notes: `${SAMPLE_SEED_NOTE}: closed walk-in session`,
      openedBy: receptionist._id,
      closedBy: receptionist._id
    }
  ];

  const sessions = {
    openWalkIn: sessionDocs[0],
    openReservation: sessionDocs[1],
    closedReservation: sessionDocs[2],
    closedWalkIn: sessionDocs[3]
  };

  const closedReservationDurationMinutes = 150;
  const closedReservationRoomCharge = rooms.C301.hourlyRate / 60 * closedReservationDurationMinutes;
  const closedReservationProductCharge = sessions.closedReservation.itemsSubtotal;
  const closedReservationSubtotal = closedReservationRoomCharge + closedReservationProductCharge;
  const closedReservationDiscount = 50;
  const closedReservationTax = 80;

  const closedWalkInDurationMinutes = 100;
  const closedWalkInRoomCharge = rooms.D401.hourlyRate / 60 * closedWalkInDurationMinutes;
  const closedWalkInProductCharge = sessions.closedWalkIn.itemsSubtotal;
  const closedWalkInSubtotal = closedWalkInRoomCharge + closedWalkInProductCharge;
  const closedWalkInDiscount = 0;
  const closedWalkInTax = 48.3;

  const invoiceDocs = [
    {
      _id: new mongoose.Types.ObjectId(),
      sessionId: sessions.closedReservation._id,
      invoiceNumber: "INV-SAMPLE-20260420-0001",
      paymentStatus: "paid",
      paymentMethod: "cash",
      paidAt: closedReservationEnd,
      paidBy: receptionist._id,
      lines: buildInvoiceLines({
        session: sessions.closedReservation,
        roomCharge: closedReservationRoomCharge,
        durationMinutes: closedReservationDurationMinutes
      }),
      roomCharge: closedReservationRoomCharge,
      productCharge: closedReservationProductCharge,
      subtotal: closedReservationSubtotal,
      discountAmount: closedReservationDiscount,
      taxAmount: closedReservationTax,
      grandTotal: closedReservationSubtotal - closedReservationDiscount + closedReservationTax,
      notes: `${SAMPLE_SEED_NOTE}: paid cash invoice`
    },
    {
      _id: new mongoose.Types.ObjectId(),
      sessionId: sessions.closedWalkIn._id,
      invoiceNumber: "INV-SAMPLE-20260414-0002",
      paymentStatus: "paid",
      paymentMethod: "qr",
      paidAt: closedWalkInEnd,
      paidBy: receptionist._id,
      lines: buildInvoiceLines({
        session: sessions.closedWalkIn,
        roomCharge: closedWalkInRoomCharge,
        durationMinutes: closedWalkInDurationMinutes
      }),
      roomCharge: closedWalkInRoomCharge,
      productCharge: closedWalkInProductCharge,
      subtotal: closedWalkInSubtotal,
      discountAmount: closedWalkInDiscount,
      taxAmount: closedWalkInTax,
      grandTotal: closedWalkInSubtotal - closedWalkInDiscount + closedWalkInTax,
      notes: `${SAMPLE_SEED_NOTE}: paid QR invoice`
    }
  ];

  sessions.closedReservation.invoiceId = invoiceDocs[0]._id;
  sessions.closedWalkIn.invoiceId = invoiceDocs[1]._id;

  rooms.A102.activeReservationId = reservations.futureConfirmed._id;
  rooms.B201.currentSessionId = sessions.openWalkIn._id;
  rooms.B202.currentSessionId = sessions.openReservation._id;
  rooms.B202.activeReservationId = reservations.checkedInOpen._id;

  const stockMovements = [];
  const pushStockMovement = ({
    product,
    movementType,
    quantity,
    beforeQty,
    afterQty,
    reason,
    createdBy,
    sessionId = null,
    invoiceId = null
  }) => {
    stockMovements.push({
      _id: new mongoose.Types.ObjectId(),
      productId: product._id,
      movementType,
      quantity,
      beforeQty,
      afterQty,
      reason,
      createdBy,
      sessionId,
      invoiceId
    });
  };

  const initialStockMap = new Map([
    [products["Coca-Cola 330ml"]._id.toString(), 60],
    [products["Mineral Water 600ml"]._id.toString(), 40],
    [products["Potato Chips"]._id.toString(), 30],
    [products["Fried Rice"]._id.toString(), 20],
    [products["Ice Bucket"]._id.toString(), 15],
    [products["Seasonal Fruit Plate"]._id.toString(), 12]
  ]);

  productDocs.forEach((product) => {
    const initialQty = initialStockMap.get(product._id.toString());
    pushStockMovement({
      product,
      movementType: "stock_in",
      quantity: initialQty,
      beforeQty: 0,
      afterQty: initialQty,
      reason: `${SAMPLE_SEED_NOTE}: opening stock`,
      createdBy: admin._id
    });
  });

  const saleEvents = [
    { session: sessions.openWalkIn, invoiceId: null, items: openWalkInItems },
    { session: sessions.openReservation, invoiceId: null, items: openReservationItems },
    { session: sessions.closedReservation, invoiceId: invoiceDocs[0]._id, items: closedReservationItems },
    { session: sessions.closedWalkIn, invoiceId: invoiceDocs[1]._id, items: closedWalkInItems }
  ];

  saleEvents.forEach(({ session, invoiceId, items }) => {
    items.forEach((item) => {
      const product = productDocs.find((candidate) => candidate._id.toString() === item.productId.toString());
      const key = product._id.toString();
      const beforeQty = initialStockMap.get(key);
      const afterQty = beforeQty - item.quantity;

      initialStockMap.set(key, afterQty);

      pushStockMovement({
        product,
        movementType: "sale",
        quantity: item.quantity,
        beforeQty,
        afterQty,
        reason: `${SAMPLE_SEED_NOTE}: session sale`,
        createdBy: receptionist._id,
        sessionId: session._id,
        invoiceId
      });
    });
  });

  await Product.insertMany(productDocs);
  await Room.insertMany(roomDocs);
  await Reservation.insertMany(reservationDocs);
  await Session.insertMany(sessionDocs);
  await Invoice.insertMany(invoiceDocs);
  await StockMovement.insertMany(stockMovements);

  return {
    rooms: roomDocs.length,
    products: productDocs.length,
    reservations: reservationDocs.length,
    sessions: sessionDocs.length,
    invoices: invoiceDocs.length,
    stockMovements: stockMovements.length
  };
};

const run = async () => {
  const shouldReset = process.argv.includes(RESET_FLAG);

  try {
    await connectToDatabase();

    if (shouldReset) {
      await resetSampleCollections();
    } else {
      await ensureTargetCollectionsAreEmpty();
    }

    const result = await createSampleDataset();

    console.log("Sample data seeded successfully:");
    Object.entries(result).forEach(([key, value]) => {
      console.log(`- ${key}: ${value}`);
    });
    console.log(`- reset mode: ${shouldReset ? "enabled" : "disabled"}`);
  } catch (error) {
    console.error("Failed to seed sample data:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
