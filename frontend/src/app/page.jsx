"use client";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Component() {
  const [userframework, setFramework] = useState("react");
  const router = useRouter();

  const handleFrameworkChange = (e) => {
    setFramework(e.target.value);
    console.log(userframework);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const repository_url = e.target.elements["github-url"].value;
    const framework = userframework;
    const rootDirectory = e.target.elements["root-directory"].value;

    console.log({ repository_url, framework, rootDirectory });

    try {
      const endpoint = "http://localhost:9000/deploy";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repository_url, framework, rootDirectory }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        const projectId = await data.data.projectId;
        router.push(`/logs/${projectId}`);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while deploying your app");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <header className="max-w-xl w-full px-4 md:px-0">
        <h1 className="text-3xl font-bold text-center mb-2">
          Welcome to vercelLite
        </h1>
        <h1 className="text-xl font-bold text-center mb-4">
          A lightweight version of Vercel to deploy React apps
        </h1>
      </header>
      <div className="max-w-xl w-full px-4 md:px-0 mt-8">
        <Card>
          <CardContent className="space-y-4 p-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="github-url">Github URL</Label>
                <Input
                  id="github-url"
                  type="url"
                  placeholder="Enter your Github URL"
                />
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="framework">Framework</Label>
                <Select id="framework">
                  <SelectTrigger>
                    <SelectValue placeholder="Select a framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="react">React</SelectItem>
                    {/* <SelectItem value="nextjs">Next.js</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="root-directory">
                  Root Directory : ( "/" if already in root folder )
                </Label>
                <Input
                  id="root-directory"
                  placeholder="Enter your root directory"
                />
              </div>
              <Button type="submit" className="w-full mt-4">
                Deploy
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}