export type AppointmentStatus =
  | "pendiente"
  | "confirmado"
  | "completado"
  | "cancelado";

export type PaymentStatus = "pendiente" | "pagado";

export type Client = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  created_at: string;
};

export type Employee = {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  work_start_time: string;
  work_end_time: string;
  work_days: string[];
  created_at: string;
};

export type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description?: string | null;
  active: boolean;
  created_at: string;
};

export type EmployeeService = {
  id: string;
  employee_id: string;
  service_id: string;
};

export type Appointment = {
  id: string;
  client_id: string;
  employee_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  amount: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  employee?: Employee;
  service?: Service;
};

export type DashboardData = {
  clients: Client[];
  employees: Employee[];
  services: Service[];
  appointments: Appointment[];
  employeeServices: EmployeeService[];
};
