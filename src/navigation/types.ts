// src/navigation/types.ts
export interface MentoringData {
  id: number;
  trainer_name: string;
  operator_name: string;
  site: string;
  area: string;
  unit_number: string;
  date_mentoring: string;
  start_time: string;
  end_time: string;
  average_point_observation: string;
  average_point_mentoring: string;
}
export interface DailyActivity {
  id: number;
  jde_no: string;
  employee_name: string;
  site: string;
  date_activity: string; // format: "YYYY-MM-DD HH:mm:ss"
  kpi_type: string;
  activity_name: string;
  activity: string;
  unit_model: string;
  total_participant: number;
  total_hour: number;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export interface TrainHours {
  id: number;
  jde_no: number;
  employee_name: string;
  position: string;
  training_type: string; // format: "YYYY-MM-DD HH:mm:ss"
  unit_class: number;
  unit_type: string;
  code: number;
  batch: string;
  plan_total_hm: number;
  hm_start: number;
  hm_end: number;
  total_hm: number;
  progres: number;
  site: string;
  date_activity: string;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

export type RootStackParamList = {
  AuthLoading: undefined;
  Login: undefined;
  FullDashboard: undefined;
  AdminDashboard: undefined;
  TrainerDashboard: undefined;
  //Data Mentoring
  Data: undefined;
  EditDataMentoring: {data: any};
  FormDigger: {unitType: string};
  FormHauler: {unitType: string};
  FormBuldozer: {unitType: string};
  FormGrader: {unitType: string};
  //Daily
  DailyActivity: undefined;
  AddDailyActivity: undefined;
  EditDailyActivity: {data: any};
  //TrainHours
  TrainHours: undefined;
  AddTrainHours: undefined;
  EditTrainHours: {data: any};
};
