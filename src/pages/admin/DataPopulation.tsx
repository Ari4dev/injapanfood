import React from 'react';
import { Helmet } from 'react-helmet-async';
import DataPopulator from '@/components/admin/DataPopulator';

const DataPopulation: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Data Population - Admin</title>
        <meta name="description" content="Populate sample data to Firestore database" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <DataPopulator />
      </div>
    </>
  );
};

export default DataPopulation;
