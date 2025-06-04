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

export type RootStackParamList = {
  AuthLoading: undefined;
  Login: undefined;
  FullDashboard: undefined;
  AdminDashboard: undefined;
  TrainerDashboard: undefined;
  Data: undefined;
  EditDataMentoring: {data: any};
  AddDataMentoring: {data: any};
  FormDigger: undefined;
  FormHauler: undefined;
  FormBuldozer: undefined;
  FormGrader: undefined;
  TrainHours: undefined;
  DailyActivity: undefined;
};
