// Types alignés sur les DTO du backend (GlycemieApi/Dtos).

export type MeasurementMoment =
  | 'Fasting'
  | 'OneHourAfterMeal'
  | 'TwoHoursAfterMeal'
  | 'FourHoursOrMoreAfterMeal';

export type GlycemiaLevel = 'Low' | 'Normal' | 'High' | 'VeryHigh';

export interface User {
  id: string;
  firstName: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface RegisterRequest {
  firstName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GlycemiaThresholds {
  lowBelow: number;
  normalBelow: number;
  highBelow: number;
}

export interface GlycemiaInterpretation {
  level: GlycemiaLevel;
  title: string;
  message: string;
  advice: string[];
  thresholds: GlycemiaThresholds;
  disclaimer: string;
}

export interface Reading {
  id: string;
  value: number;
  moment: MeasurementMoment;
  measuredAt: string;
  note: string | null;
  interpretation: GlycemiaInterpretation;
}

export interface CreateReadingRequest {
  value: number;
  moment: MeasurementMoment;
  measuredAt?: string;
  note?: string;
}
