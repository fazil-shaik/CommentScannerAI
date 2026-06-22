interface DashboardProps {
    
}
 
const Dashboard: React.FC<DashboardProps> = () => {
    return ( 
        <> 
            <h1 className="text-3xl font-bold text-center bg-amber-50
          rounded-lg p-4 mt-4 shadow-md 
          font-serif text-amber-900
        ">Welcome to the Dashboard</h1>
        </>
     );
}
 
export default Dashboard;