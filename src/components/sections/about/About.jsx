import React from "react";
import { AboutData } from "./aboutdata";

const About = () => {
  return (
    <div>
      <div className="Pagearea py-24 flex gap-8 flex-col lg:flex-row">
        <div className="w-full lg:w-4/12">
          <img
            className="w-32 object-cover"
            src="/image/logo/logo.png"
            alt="Pathangan Logo"
          />
          <h1 className="text-3xl font-bold mb-6">{AboutData.title}</h1>
          <p className="mb-4 leading-7">{AboutData.description}</p>
          <p className="mb-4 leading-7">{AboutData.mission}</p>
          <p className="mb-4 leading-7">{AboutData.vision}</p>
        </div>
        <div className="w-full lg:w-8/12">
          <h2 className="text-2xl font-bold mb-6 mt-12">আমাদের টিম</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {AboutData.Team.map((member, index) => (
              <div key={index} className="text-center">
                <img
                  className="w-32 h-32 rounded-full mx-auto object-cover bg-gray-200"
                  src={member.image}
                  alt={member.name}
                />
                <h3 className="mt-4 text-lg font-semibold">{member.name}</h3>
                <p className="text-sm text-gray-600">{member.position}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
