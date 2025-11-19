/**
 * Education Service - DiaspoMoney
 * Service d'éducation (Écoles & Institutions) Company-Grade
 * Basé sur la charte de développement
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Repository Pattern
 * - Dependency Injection
 * - Singleton Pattern
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache)
 * - Error Handling Pattern (Sentry)
 */

import { LOCALE, SPECIALITY_TYPES, CURRENCIES } from '@/lib/constants';
import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { childLogger } from '@/lib/logger';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { random } from '@/lib/utils';
import { getQuoteRepository, IQuoteRepository } from '@/repositories';
import { notificationService } from '@/services/notification/notification.service';
import * as Sentry from '@sentry/nextjs';

export interface School {
  id: string;
  name: string;
  type: 'PRIMARY' | 'SECONDARY' | 'UNIVERSITY' | 'TECHNICAL' | 'VOCATIONAL';
  level: 'PRIMARY' | 'SECONDARY' | 'HIGHER' | 'ADULT';
  description: string;
  address: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  accreditation: {
    isAccredited: boolean;
    accreditingBody?: string;
    accreditationDate?: Date;
    expiresAt?: Date;
  };
  programs: EducationalProgram[];
  facilities: SchoolFacility[];
  fees: FeeStructure;
  academicCalendar: AcademicYear[];
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EducationalProgram {
  id: string;
  name: string;
  description: string;
  level:
    | 'PRIMARY'
    | 'SECONDARY'
    | 'BACHELOR'
    | 'MASTER'
    | 'PHD'
    | 'CERTIFICATE';
  duration: number; // months
  credits?: number;
  requirements: string[];
  curriculum: Course[];
  fees: {
    tuition: number;
    currency: string;
    paymentPlans: PaymentPlan[];
  };
  isActive: boolean;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
  credits: number;
  prerequisites: string[];
  instructor: {
    name: string;
    email: string;
    qualifications: string[];
  };
  schedule: CourseSchedule[];
  isActive: boolean;
}

export interface CourseSchedule {
  day:
    | 'MONDAY'
    | 'TUESDAY'
    | 'WEDNESDAY'
    | 'THURSDAY'
    | 'FRIDAY'
    | 'SATURDAY'
    | 'SUNDAY';
  startTime: string;
  endTime: string;
  room?: string;
  isOnline: boolean;
}

export interface SchoolFacility {
  name: string;
  type:
    | 'LIBRARY'
    | 'LABORATORY'
    | 'GYM'
    | 'CAFETERIA'
    | 'DORMITORY'
    | 'TRANSPORT'
    | 'OTHER';
  description: string;
  capacity?: number;
  isAvailable: boolean;
}

export interface FeeStructure {
  tuition: number;
  currency: string;
  additionalFees: AdditionalFee[];
  paymentPlans: PaymentPlan[];
  scholarships: Scholarship[];
}

export interface AdditionalFee {
  name: string;
  amount: number;
  type: 'MANDATORY' | 'OPTIONAL';
  description: string;
}

export interface PaymentPlan {
  name: string;
  installments: number;
  frequency: 'MONTHLY' | 'QUARTERLY' | 'SEMESTERLY' | 'ANNUALLY';
  discount?: number;
  description: string;
}

export interface Scholarship {
  name: string;
  type: 'MERIT' | 'NEED_BASED' | 'ATHLETIC' | 'ARTISTIC';
  amount: number;
  percentage?: number;
  requirements: string[];
  applicationDeadline: Date;
  isActive: boolean;
}

export interface AcademicYear {
  year: string;
  startDate: Date;
  endDate: Date;
  terms: AcademicTerm[];
  holidays: Holiday[];
}

export interface AcademicTerm {
  name: string;
  startDate: Date;
  endDate: Date;
  type: 'SEMESTER' | 'TRIMESTER' | 'QUARTER';
}

export interface Holiday {
  name: string;
  date: Date;
  type: 'NATIONAL' | 'RELIGIOUS' | 'ACADEMIC';
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  nationality: string;
  address: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  academicInfo: {
    studentId: string;
    programId: string;
    enrollmentDate: Date;
    status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';
    level: string;
    year: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  id: string;
  studentId: string;
  schoolId: string;
  programId: string;
  academicYear: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  applicationDate: Date;
  decisionDate?: Date;
  documents: EnrollmentDocument[];
  fees: {
    totalAmount: number;
    currency: string;
    paidAmount: number;
    remainingAmount: number;
    paymentPlan: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrollmentDocument {
  id: string;
  name: string;
  type:
    | 'TRANSCRIPT'
    | 'DIPLOMA'
    | 'BIRTH_CERTIFICATE'
    | 'ID_CARD'
    | 'PHOTO'
    | 'OTHER';
  url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: Date;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  recordedBy: string;
  notes?: string;
}

export interface EducationFilters {
  query?: string;
  type?: string;
  level?: string;
  city?: string;
  country?: string;
  minTuition?: number;
  maxTuition?: number;
  programs?: string[];
  facilities?: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

/**
 * EducationService utilisant le Service Layer Pattern
 * Utilise le Repository Pattern pour l'accès aux données (Dependency Injection)
 */
export class EducationService {
  private static instance: EducationService;
  private quoteRepository: IQuoteRepository;
  private readonly log = childLogger({
    component: 'EducationService',
  });

  private constructor() {
    // Dependency Injection : injecter le repository
    this.quoteRepository = getQuoteRepository();
  }

  static getInstance(): EducationService {
    if (!EducationService.instance) {
      EducationService.instance = new EducationService();
    }
    return EducationService.instance;
  }

  /**
   * Rechercher des écoles
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'EducationService:searchSchools' }) // Cache 5 minutes
  async searchSchools(filters: EducationFilters): Promise<School[]> {
    try {
      // TODO: Implémenter la recherche avec Elasticsearch
      const mockSchools: School[] = [
        {
          id: 'school_1',
          name: 'Université Cheikh Anta Diop',
          type: 'UNIVERSITY',
          level: 'HIGHER',
          description: 'Université publique de référence au Sénégal',
          address: {
            street: 'Avenue Cheikh Anta Diop',
            city: 'Dakar',
            country: 'SN',
            postalCode: '10700',
            coordinates: { latitude: 14.6928, longitude: -17.4467 },
          },
          contact: {
            phone: '+221 33 825 05 55',
            email: 'contact@ucad.sn',
            website: 'https://www.ucad.sn',
          },
          accreditation: {
            isAccredited: true,
            accreditingBody: "Ministère de l'Enseignement Supérieur",
            accreditationDate: new Date('2020-01-01'),
          },
          programs: [],
          facilities: [
            {
              name: 'Bibliothèque Centrale',
              type: 'LIBRARY',
              description: 'Bibliothèque avec plus de 100,000 ouvrages',
              capacity: 500,
              isAvailable: true,
            },
          ],
          fees: {
            tuition: 50000,
            currency: CURRENCIES.XOF.code,
            additionalFees: [],
            paymentPlans: [],
            scholarships: [],
          },
          academicCalendar: [],
          isActive: true,
          rating: 4.5,
          reviewCount: 234,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'education_schools_searched',
        value: 1,
        timestamp: new Date(),
        labels: {
          search_type: filters.type || 'all',
          level: filters.level || 'all',
          has_location: filters.coordinates ? 'true' : 'false',
        },
        type: 'counter',
      });

      const result = mockSchools;
      this.log.debug({ count: result.length, filters }, 'Schools searched');
      return result;
    } catch (error) {
      this.log.error({ error, filters }, 'Error in searchSchools');
      Sentry.captureException(error as Error, {
        tags: { component: 'EducationService', action: 'searchSchools' },
        extra: { filters },
      });
      throw error;
    }
  }

  /**
   * Récupérer une école par ID
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'EducationService:getSchool' }) // Cache 5 minutes
  async getSchool(_schoolId: string): Promise<School | null> {
    // TODO: Récupérer depuis la base de données
    return null;
  }

  /**
   * Inscrire un étudiant
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('EducationService:*') // Invalider le cache après inscription
  async enrollStudent(
    studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>,
    schoolId: string,
    programId: string,
    academicYear: string,
  ): Promise<Enrollment> {
    try {
      // Créer l'étudiant
      const student: Student = {
        ...studentData,
        id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Créer l'inscription
      const enrollment: Enrollment = {
        id: `enroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        studentId: student.id,
        schoolId,
        programId,
        academicYear,
        status: 'PENDING',
        applicationDate: new Date(),
        documents: [],
        fees: {
          totalAmount: 0, // TODO: Calculer depuis le programme
          currency: 'XOF',
          paidAmount: 0,
          remainingAmount: 0,
          paymentPlan: 'ANNUAL',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TODO: Sauvegarder en base de données
      // await Student.create(student);
      // await Enrollment.create(enrollment);

      // Envoyer une notification de confirmation d'inscription
      await notificationService.sendNotification({
        recipient: student.email,
        type: 'ENROLLMENT_CONFIRMATION',
        template: 'enrollment_confirmation',
        data: {
          studentName: `${student.firstName} ${student.lastName}`,
          schoolName: 'École', // TODO: Récupérer le nom de l'école
          programName: 'Programme', // TODO: Récupérer le nom du programme
          academicYear,
        },
        channels: [
          { type: 'EMAIL', enabled: true, priority: 'HIGH' },
          { type: 'SMS', enabled: true, priority: 'MEDIUM' },
        ],
        locale: LOCALE.DEFAULT,
        priority: 'HIGH',
      });

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'education_enrollments_created',
        value: 1,
        timestamp: new Date(),
        labels: {
          school_id: schoolId,
          program_id: programId,
          academic_year: academicYear,
        },
        type: 'counter',
      });

      this.log.info(
        { enrollmentId: enrollment.id, studentId: student.id, schoolId },
        'Student enrolled successfully',
      );
      return enrollment;
    } catch (error) {
      this.log.error({ error, schoolId, programId }, 'Error in enrollStudent');
      Sentry.captureException(error as Error, {
        tags: { component: 'EducationService', action: 'enrollStudent' },
        extra: { schoolId, programId },
      });
      throw error;
    }
  }

  /**
   * Effectuer un paiement de frais de scolarité
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('EducationService:*') // Invalider le cache après paiement
  async payTuition(
    _enrollmentId: string,
    amount: number,
    currency: string,
    paymentMethod: string,
  ): Promise<{
    success: boolean;
    transactionId?: string;
    remainingAmount: number;
  }> {
    try {
      // TODO: Traiter le paiement
      // const enrollment = await Enrollment.findById(enrollmentId);
      // if (!enrollment) {
      //   throw new Error('Inscription non trouvée');
      // }

      // const newPaidAmount = enrollment.fees.paidAmount + amount;
      // const remainingAmount = enrollment.fees.totalAmount - newPaidAmount;

      // await Enrollment.updateOne(
      //   { _id: enrollmentId },
      //   {
      //     'fees.paidAmount': newPaidAmount,
      //     'fees.remainingAmount': remainingAmount,
      //     updatedAt: new Date()
      //   }
      // );

      // Envoyer une notification de paiement
      // await notificationService.sendTuitionPaymentConfirmation(enrollment, amount);

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'education_tuition_payments',
        value: amount,
        timestamp: new Date(),
        labels: {
          currency,
          payment_method: paymentMethod,
        },
        type: 'counter',
      });

      return {
        success: true,
        transactionId: `txn_${Date.now()}`,
        remainingAmount: 0, // TODO: Calculer le montant restant
      };
    } catch (error) {
      this.log.error(
        { error, enrollmentId: _enrollmentId, amount },
        'Error in payTuition',
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'EducationService', action: 'payTuition' },
        extra: { enrollmentId: _enrollmentId, amount },
      });
      throw error;
    }
  }

  /**
   * Enregistrer une note
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('EducationService:*') // Invalider le cache après enregistrement de note
  async recordGrade(
    studentId: string,
    courseId: string,
    academicYear: string,
    term: string,
    grade: number,
    maxGrade: number,
    instructorId: string,
    comments?: string,
  ): Promise<any> {
    try {
      const gradeRecord = {
        id: `grade_${Date.now()}_${random(1000000, 9999999)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        studentId,
        courseId,
        academicYear,
        term,
        grade,
        maxGrade,
        letterGrade: this.calculateLetterGrade(grade, maxGrade),
        comments: comments || '',
        instructorId,
        gradedAt: new Date(),
      };

      // TODO: Persist gradeRecord in database if needed

      this.log.info(
        { gradeId: gradeRecord.id, studentId, courseId, grade },
        'Grade recorded successfully',
      );
      return gradeRecord;
    } catch (error) {
      this.log.error({ error, studentId, courseId }, 'Error in recordGrade');
      Sentry.captureException(error as Error, {
        tags: { component: 'EducationService', action: 'recordGrade' },
        extra: { studentId, courseId },
      });
      throw error;
    }
  }

  /**
   * Enregistrer la présence
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('EducationService:*') // Invalider le cache après enregistrement de présence
  async recordAttendance(
    studentId: string,
    courseId: string,
    date: Date,
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
    recordedBy: string,
    notes?: string,
  ): Promise<Attendance> {
    try {
      const attendance: Attendance = {
        id: `att_${Date.now()}_${random(1000000, 9999999)}`,
        studentId,
        courseId,
        date,
        status,
        recordedBy,
        notes: notes || '',
      };

      // TODO: Sauvegarder en base de données
      // await Attendance.create(attendance);

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'education_attendance_recorded',
        value: 1,
        timestamp: new Date(),
        labels: {
          status,
          course_id: courseId,
        },
        type: 'counter',
      });

      this.log.info(
        { attendanceId: attendance.id, studentId, courseId, status },
        'Attendance recorded successfully',
      );
      return attendance;
    } catch (error) {
      this.log.error(
        { error, studentId, courseId },
        'Error in recordAttendance',
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'EducationService', action: 'recordAttendance' },
        extra: { studentId, courseId },
      });
      throw error;
    }
  }

  /**
   * Récupérer le bulletin de notes d'un étudiant
   */
  @Log({ level: 'debug', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'EducationService:getStudentTranscript' }) // Cache 5 minutes
  async getStudentTranscript(
    _studentId: string,
    _academicYear?: string,
  ): Promise<{
    student: Student;
    grades: any[];
    gpa: number;
    credits: number;
  }> {
    try {
      // TODO: Fetch real student, grades and credit values from database
      return {
        student: {} as Student,
        grades: [],
        gpa: 0,
        credits: 0,
      };
    } catch (error) {
      this.log.error(
        { error, studentId: _studentId },
        'Error in getStudentTranscript',
      );
      Sentry.captureException(error as Error, {
        tags: { component: 'EducationService', action: 'getStudentTranscript' },
        extra: { studentId: _studentId },
      });
      throw error;
    }
  }

  /**
   * Calculer la note alphabétique
   */
  private calculateLetterGrade(grade: number, maxGrade: number): string {
    const percentage = (grade / maxGrade) * 100;

    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'C-';
    if (percentage >= 45) return 'D+';
    if (percentage >= 40) return 'D';
    return 'F';
  }

  /**
   * Calculer la moyenne générale
   */
  // private _calculateGPA(grades: any[]): number {
  //   if (!grades || grades.length === 0) return 0;

  //   const totalPoints = grades.reduce((sum: number, grade: any) => {
  //     const percentage = (grade.grade / grade.maxGrade) * 100;
  //     let points = 0;

  //     if (percentage >= 90) points = 4.0;
  //     else if (percentage >= 85) points = 3.7;
  //     else if (percentage >= 80) points = 3.3;
  //     else if (percentage >= 75) points = 3.0;
  //     else if (percentage >= 70) points = 2.7;
  //     else if (percentage >= 65) points = 2.3;
  //     else if (percentage >= 60) points = 2.0;
  //     else if (percentage >= 55) points = 1.7;
  //     else if (percentage >= 50) points = 1.3;
  //     else if (percentage >= 45) points = 1.0;

  //     return sum + points;
  //   }, 0);

  //   return round(totalPoints / grades.length, 2);
  // }

  /**
   * Créer une demande de renseignements éducation
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('quote:*')
  async createEducationInquiry(data: {
    studentType: 'SELF' | 'CHILD' | 'DEPENDENT';
    studentInfo: {
      firstName: string;
      lastName: string;
      dateOfBirth?: string;
      gender?: 'MALE' | 'FEMALE' | 'OTHER';
      nationality?: string;
    };
    academicInfo: {
      currentLevel?: string;
      desiredProgram?: string;
      academicYear?: string;
      previousEducation?: string;
    };
    contact: {
      name: string;
      email: string;
      phone?: string;
      relationship?: string;
    };
    preferences?: {
      language?: string;
      schedule?: string;
      budget?: number;
      urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    questions?: string;
    schoolId: string;
  }): Promise<any> {
    try {
      // Créer la demande de renseignements via le repository
      const quoteData: any = {
        type: SPECIALITY_TYPES.EDUCATION,
        studentType: data.studentType,
        studentInfo: data.studentInfo,
        academicInfo: data.academicInfo,
        contact: data.contact,
        questions: data.questions,
        status: 'PENDING',
      };

      // Ajouter les champs optionnels seulement s'ils sont définis
      if (data.preferences) {
        quoteData.preferences = data.preferences;
      }
      if (data.schoolId) {
        quoteData.schoolId = data.schoolId;
      }

      const quote = await this.quoteRepository.create(quoteData);

      // Envoyer une notification
      if (data.contact.email) {
        await notificationService.sendNotification({
          recipient: data.contact.email,
          type: 'EDUCATION_INQUIRY',
          template: 'education_inquiry',
          data: {
            quoteId: quote.id,
            studentName: `${data.studentInfo.firstName} ${data.studentInfo.lastName}`,
            program: data.academicInfo.desiredProgram,
          },
          channels: [
            { type: 'EMAIL', enabled: true, priority: 'MEDIUM' },
            { type: 'IN_APP', enabled: true, priority: 'MEDIUM' },
          ],
          locale: LOCALE.DEFAULT,
          priority: 'MEDIUM',
        });
      }

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'education_inquiry_requests',
        value: 1,
        timestamp: new Date(),
        labels: {
          student_type: data.studentType,
          academic_level: data.academicInfo.currentLevel || 'unknown',
          has_school: data.schoolId ? 'true' : 'false',
        },
        type: 'counter',
      });

      this.log.info(
        {
          quoteId: quote.id,
          studentType: data.studentType,
          schoolId: data.schoolId,
        },
        'Education inquiry created successfully',
      );
      return quote;
    } catch (error) {
      this.log.error({ error, data }, 'Error in createEducationInquiry');
      Sentry.captureException(error as Error, {
        tags: {
          component: 'EducationService',
          action: 'createEducationInquiry',
        },
        extra: { studentType: data.studentType },
      });
      throw error;
    }
  }
}

// Export de l'instance singleton
export const educationService = EducationService.getInstance();
