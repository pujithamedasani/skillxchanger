import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SkillTag from "@/components/SkillTag";
import { CAMPUS_LOCATION_NAMES } from "@/lib/campusLocations";
import { toast } from "sonner";
import { Save, Plus } from "lucide-react";

const DEPARTMENTS = [
  "Computer Science", "Electronics", "Mechanical", "Civil",
  "Electrical", "Biotechnology", "Chemistry", "Physics", "Mathematics", "Business",
];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export default function Profile() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [bio, setBio] = useState("");
  const [campusLocation, setCampusLocation] = useState("");
  const [skillsTeach, setSkillsTeach] = useState<string[]>([]);
  const [skillsLearn, setSkillsLearn] = useState<string[]>([]);
  const [newTeach, setNewTeach] = useState("");
  const [newLearn, setNewLearn] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setDepartment(profile.department || "");
      setYearOfStudy(profile.year_of_study || "");
      setBio(profile.bio || "");
      setCampusLocation(profile.campus_location || "");
      setSkillsTeach(profile.skills_teach || []);
      setSkillsLearn(profile.skills_learn || []);
    }
  }, [profile]);

  const addSkill = (type: "teach" | "learn") => {
    const val = (type === "teach" ? newTeach : newLearn).trim();
    if (!val) return;
    if (type === "teach") {
      if (!skillsTeach.includes(val)) setSkillsTeach([...skillsTeach, val]);
      setNewTeach("");
    } else {
      if (!skillsLearn.includes(val)) setSkillsLearn([...skillsLearn, val]);
      setNewLearn("");
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: fullName,
        department,
        year_of_study: yearOfStudy,
        bio,
        campus_location: campusLocation,
        skills_teach: skillsTeach,
        skills_learn: skillsLearn,
      });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">Your Profile</h1>

        <Card>
          <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year of Study</Label>
                <Select value={yearOfStudy} onValueChange={setYearOfStudy}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Campus Location</Label>
              <Select value={campusLocation} onValueChange={setCampusLocation}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {CAMPUS_LOCATION_NAMES.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself..." rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Skills I Can Teach</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-3 flex gap-2">
              <Input
                value={newTeach}
                onChange={(e) => setNewTeach(e.target.value)}
                placeholder="e.g. Python, Photoshop"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("teach"))}
              />
              <Button size="icon" variant="outline" onClick={() => addSkill("teach")}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsTeach.map((s) => (
                <SkillTag
                  key={s}
                  skill={s}
                  variant="teach"
                  onRemove={() => setSkillsTeach(skillsTeach.filter((x) => x !== s))}
                />
              ))}
              {skillsTeach.length === 0 && <p className="text-sm text-muted-foreground">No skills added yet</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Skills I Want to Learn</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-3 flex gap-2">
              <Input
                value={newLearn}
                onChange={(e) => setNewLearn(e.target.value)}
                placeholder="e.g. React, UI Design"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("learn"))}
              />
              <Button size="icon" variant="outline" onClick={() => addSkill("learn")}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillsLearn.map((s) => (
                <SkillTag
                  key={s}
                  skill={s}
                  variant="learn"
                  onRemove={() => setSkillsLearn(skillsLearn.filter((x) => x !== s))}
                />
              ))}
              {skillsLearn.length === 0 && <p className="text-sm text-muted-foreground">No skills added yet</p>}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full gap-2" disabled={updateProfile.isPending}>
          <Save className="h-4 w-4" />
          {updateProfile.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </Layout>
  );
}
