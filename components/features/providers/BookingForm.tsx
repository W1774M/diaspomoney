"use client";

import {
  Button,
  Form,
  FormField,
  FormLabel,
  Input,
  PhoneInput,
} from "@/components/ui";
import { useForm } from "@/hooks/forms";
import { appointmentSchema, type AppointmentFormData } from "@/lib/validations";
import { Calendar, Clock, Mail, MapPin, Phone, User } from "lucide-react";
import { useState } from "react";

interface BookingFormProps {
  provider: {
    _id: string;
    name: string;
    specialty: string;
    selectedServices?: string | undefined;
    availabilities?: { start: string; end: string }[];
  };
  onClose: () => void;
  onSubmit: (data: AppointmentFormData) => void;
}

// Helper to ensure error prop is always a string (never undefined)
function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof (error as any).message === "string"
  ) {
    return (error as any).message;
  }
  return "";
}

export function BookingForm({ provider, onClose, onSubmit }: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    schema: appointmentSchema,
    defaultValues: {
      requester: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      },
      recipient: {
        firstName: "",
        lastName: "",
        phone: "",
      },
      timeslot: "",
      selectedService: null,
    },
  });

  const watchedValues = watch();

  const handleFormSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return (
          watchedValues.requester?.firstName &&
          watchedValues.requester?.lastName &&
          watchedValues.requester?.email &&
          watchedValues.requester?.phone &&
          !errors.requester?.firstName &&
          !errors.requester?.lastName &&
          !errors.requester?.email &&
          !errors.requester?.phone
        );
      case 2:
        return (
          watchedValues.recipient?.firstName &&
          watchedValues.recipient?.lastName &&
          watchedValues.recipient?.phone &&
          !errors.recipient?.firstName &&
          !errors.recipient?.lastName &&
          !errors.recipient?.phone
        );
      default:
        return true;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {Array.from({ length: totalSteps }, (_, index) => (
        <div key={index} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index + 1 < currentStep
                ? "bg-green-500 text-white"
                : index + 1 === currentStep
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
            }`}
          >
            {index + 1 < currentStep ? "✓" : index + 1}
          </div>
          {index < totalSteps - 1 && (
            <div
              className={`w-12 h-1 mx-2 ${
                index + 1 < currentStep ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Vos informations
        </h3>
        <p className="text-gray-600">
          Remplissez vos informations personnelles pour la prise de rendez-vous
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          error={getErrorMessage(errors.requester?.firstName?.message)}
        >
          <FormLabel htmlFor="requester.firstName">
            <User className="w-4 h-4 inline mr-2" />
            Prénom *
          </FormLabel>
          <Input
            id="requester.firstName"
            placeholder="Votre prénom"
            {...register("requester.firstName")}
          />
        </FormField>

        <FormField error={getErrorMessage(errors.requester?.lastName?.message)}>
          <FormLabel htmlFor="requester.lastName">
            <User className="w-4 h-4 inline mr-2" />
            Nom *
          </FormLabel>
          <Input
            id="requester.lastName"
            placeholder="Votre nom"
            {...register("requester.lastName")}
          />
        </FormField>
      </div>

      <FormField error={getErrorMessage(errors.requester?.email?.message)}>
        <FormLabel htmlFor="requester.email">
          <Mail className="w-4 h-4 inline mr-2" />
          Email *
        </FormLabel>
        <Input
          id="requester.email"
          type="email"
          placeholder="votre.email@exemple.com"
          {...register("requester.email")}
        />
      </FormField>

      <FormField error={getErrorMessage(errors.requester?.phone?.message)}>
        <FormLabel htmlFor="requester.phone">
          <Phone className="w-4 h-4 inline mr-2" />
          Téléphone *
        </FormLabel>
        <PhoneInput
          id="requester.phone"
          value={watchedValues.requester?.phone || ""}
          onChange={value => setValue("requester.phone", value)}
          placeholder="6 12 34 56 78"
        />
      </FormField>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Informations du bénéficiaire
        </h3>
        <p className="text-gray-600">
          Remplissez les informations de la personne qui recevra le service
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          error={getErrorMessage(errors.recipient?.firstName?.message)}
        >
          <FormLabel htmlFor="recipient.firstName">
            <User className="w-4 h-4 inline mr-2" />
            Prénom *
          </FormLabel>
          <Input
            id="recipient.firstName"
            placeholder="Prénom du bénéficiaire"
            {...register("recipient.firstName")}
          />
        </FormField>

        <FormField error={getErrorMessage(errors.recipient?.lastName?.message)}>
          <FormLabel htmlFor="recipient.lastName">
            <User className="w-4 h-4 inline mr-2" />
            Nom *
          </FormLabel>
          <Input
            id="recipient.lastName"
            placeholder="Nom du bénéficiaire"
            {...register("recipient.lastName")}
          />
        </FormField>
      </div>

      <FormField error={getErrorMessage(errors.recipient?.phone?.message)}>
        <FormLabel htmlFor="recipient.phone">
          <Phone className="w-4 h-4 inline mr-2" />
          Téléphone *
        </FormLabel>
        <PhoneInput
          id="recipient.phone"
          value={watchedValues.recipient?.phone || ""}
          onChange={value => setValue("recipient.phone", value)}
          placeholder="6 12 34 56 78"
        />
      </FormField>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Détails du rendez-vous
        </h3>
        <p className="text-gray-600">
          Choisissez le service et le créneau horaire
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h4 className="font-medium text-gray-900 mb-2">
          Prestataire sélectionné
        </h4>
        <div className="flex items-center space-x-3">
          <MapPin className="w-4 h-4 text-gray-500" />
          <div>
            <p className="font-medium">{provider.name}</p>
            <p className="text-sm text-gray-600">{provider.specialty}</p>
          </div>
        </div>
      </div>

      <FormField error={getErrorMessage(errors.timeslot?.message)}>
        <FormLabel htmlFor="timeslot">
          <Clock className="w-4 h-4 inline mr-2" />
          Créneau horaire *
        </FormLabel>
        <select
          id="timeslot"
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          {...register("timeslot")}
        >
          <option value="">Sélectionnez un créneau</option>
          {provider.availabilities?.map((slot, index) => (
            <option key={index} value={`${slot.start}-${slot.end}`}>
              {slot.start} - {slot.end}
            </option>
          ))}
        </select>
      </FormField>

      {provider.selectedServices && (
        <FormField error="">
          <FormLabel htmlFor="selectedService">
            <Calendar className="w-4 h-4 inline mr-2" />
            Service
          </FormLabel>
          <select
            id="selectedService"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onChange={e => {
              const service = e.target.value;
              if (service) {
                setValue("selectedService", {
                  id: parseInt(service),
                  name: service,
                  price: 0, // Prix à définir selon le service
                });
              }
            }}
          >
            <option value="">Sélectionnez un service</option>
            {provider.selectedServices.split(",").map((service, index) => (
              <option key={index} value={service.trim()}>
                {service.trim()}
              </option>
            ))}
          </select>
        </FormField>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  const renderNavigationButtons = () => (
    <div className="flex justify-between pt-6">
      <Button
        type="button"
        variant="outline"
        onClick={currentStep === 1 ? onClose : prevStep}
        disabled={isSubmitting}
      >
        {currentStep === 1 ? "Annuler" : "Précédent"}
      </Button>

      {currentStep < totalSteps ? (
        <Button
          type="button"
          variant="primary"
          onClick={nextStep}
          disabled={!canProceedToNext() || isSubmitting}
        >
          Suivant
        </Button>
      ) : (
        <Button
          type="submit"
          variant="primary"
          disabled={!canProceedToNext() || isSubmitting}
          isLoading={isSubmitting}
        >
          Confirmer le rendez-vous
        </Button>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Prise de rendez-vous
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          type="button"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {renderStepIndicator()}

      <Form onSubmit={handleSubmit(handleFormSubmit)}>
        {renderCurrentStep()}
        {renderNavigationButtons()}
      </Form>
    </div>
  );
}
