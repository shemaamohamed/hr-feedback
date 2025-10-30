'use client';


import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText} from 'lucide-react';
import { feedbackService } from '@/lib/firebase/feedback';
import Feedback from '@/components/hr/feedback/feedback';
import   {subscribeEmployees } from '@/lib/firebase/userService'
import Chart from "@/components/hr/feedback/chart"
import { Button } from '@/components/ui/button';
import NewEmployee from "@/components/hr/employee/add"

type Feedback = {
    id: string;
    employeeName?: string;
    notes?: string;
    updatedAt?: Date | { toDate: () => Date } | null;

};
type Employee ={
  email: string;
  name: string;
  role?: 'employee';

}

export default function HRDashboardPage() {



  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);


  useEffect(() => {
    const unsubscribe = subscribeEmployees((list) => setEmployees(list));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = feedbackService.subscribeFeedback((list) =>
      setFeedbackList(list)
      
    );
    return () => unsubscribe();
  }, []);



  const stats = [
    {
      title: 'Employees',
      value: employees.length.toString(),
      change: 'Total Employees',
      icon: Users,
      color: 'text-white',
      bgColor: 'bg-primary',
    },
    {
      title: 'Feedbacks',
      value: feedbackList.length.toString(),
      change: 'Total received',
      icon: FileText,
     color: 'text-white',
      bgColor: 'bg-primary',
    },

  ];

  return (
    <div className=" over-flow-y">
   

      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            
            </Card>
          );
        })}
        <Button
        onClick={() => {
              setIsModalOpen(true);
            }}

        >
          Add new Employee +
          </Button>

       
      </div>
      <Chart/>
      <Feedback/>
       {isModalOpen  && (
        <NewEmployee setIsModalOpen={setIsModalOpen} />
      )}


      

        
    </div>
  );
}
