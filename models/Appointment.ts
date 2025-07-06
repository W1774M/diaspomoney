import mongoose, { Document, Schema } from "mongoose";

export interface IAppointment extends Document {
  reservationNumber: string;
  requester: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  recipient: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  provider: {
    id: string | number;
    name: string;
    services: Array<{
      id?: number;
      name: string;
      price: number;
    }>;
    type: { id: string | number; value: string };
    specialty: string;
    recommended: boolean;
    apiGeo: Array<{
      place_id: number;
      licence: string;
      osm_type: string;
      osm_id: number;
      lat: string;
      lon: string;
      class: string;
      type: string;
      place_rank: number;
      importance: number;
      addresstype: string;
      name: string;
      display_name: string;
      boundingbox: string[];
    }>;
    images: string[];
    rating: number;
    reviews?: number;
    distance?: string;
  };
  selectedService: {
    id?: number;
    name: string;
    price: number;
  } | null;
  timeslot: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    reservationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    requester: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
    },
    recipient: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String, required: true },
    },
    provider: {
      id: { type: Schema.Types.Mixed, required: true },
      name: { type: String, required: true },
      services: [
        {
          id: { type: Number, required: false },
          name: { type: String, required: true },
          price: { type: Number, required: true },
        },
      ],
      type: {
        id: { type: Schema.Types.Mixed, required: true },
        value: { type: String, required: true },
      },
      specialty: { type: String, required: true },
      recommended: { type: Boolean, required: true },
      apiGeo: [
        {
          place_id: { type: Number, required: true },
          licence: { type: String, required: true },
          osm_type: { type: String, required: true },
          osm_id: { type: Number, required: true },
          lat: { type: String, required: true },
          lon: { type: String, required: true },
          class: { type: String, required: true },
          type: { type: String, required: true },
          place_rank: { type: Number, required: true },
          importance: { type: Number, required: true },
          addresstype: { type: String, required: true },
          name: { type: String, required: true },
          display_name: { type: String, required: true },
          boundingbox: [{ type: String }],
        },
      ],
      images: [{ type: String }],
      rating: { type: Number, required: true },
      reviews: { type: Number, required: false },
      distance: { type: String, required: false },
    },
    selectedService: {
      id: { type: Number, required: false },
      name: { type: String, required: true },
      price: { type: Number, required: true },
    },
    timeslot: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    totalAmount: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
AppointmentSchema.index({ reservationNumber: 1 });
AppointmentSchema.index({ "requester.email": 1 });
AppointmentSchema.index({ status: 1 });
AppointmentSchema.index({ paymentStatus: 1 });
AppointmentSchema.index({ createdAt: -1 });

export default mongoose.models.Appointment ||
  mongoose.model<IAppointment>("Appointment", AppointmentSchema);
