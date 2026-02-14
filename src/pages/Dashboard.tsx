import { useMemo } from "react";
import Layout from "@/components/Layout";
import { useProfile, useAllProfiles } from "@/hooks/useProfile";
import { useConnections, useSendConnection, useConnectionStatus } from "@/hooks/useConnections";
import { computeMatches, type MatchResult } from "@/lib/matching";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import SkillTag from "@/components/SkillTag";
import { Users, BookOpen, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function MatchCard({ match }: { match: MatchResult }) {
  const sendConnection = useSendConnection();
  const { data: myProfile } = useProfile();
  const { data: connections } = useConnections();

  const connStatus = useMemo(() => {
    if (!connections || !myProfile) return "none";
    const conn = connections.find(
      (c) =>
        (c.requester_id === myProfile.id && c.receiver_id === match.profile.id) ||
        (c.requester_id === match.profile.id && c.receiver_id === myProfile.id)
    );
    if (!conn) return "none";
    if (conn.status === "accepted") return "connected";
    if (conn.requester_id === myProfile.id) return "sent";
    return "received";
  }, [connections, myProfile, match.profile.id]);

  const handleConnect = async () => {
    try {
      await sendConnection.mutateAsync(match.profile.id);
      toast.success("Connection request sent!");
    } catch (e: any) {
      toast.error(e.message || "Failed to send request");
    }
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-card-foreground">{match.profile.full_name || "Student"}</h3>
            <p className="text-xs text-muted-foreground">
              {match.profile.department} · {match.profile.year_of_study}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">{match.compatibility}%</span>
            <p className="text-xs text-muted-foreground">match</p>
          </div>
        </div>

        <Progress value={match.compatibility} className="mb-3 h-2" />

        {match.matchingTeach.length > 0 && (
          <div className="mb-2">
            <p className="mb-1 text-xs font-medium text-muted-foreground">They can teach you:</p>
            <div className="flex flex-wrap gap-1">
              {match.matchingTeach.map((s) => (
                <SkillTag key={s} skill={s} variant="teach" />
              ))}
            </div>
          </div>
        )}

        {match.matchingLearn.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">You can teach them:</p>
            <div className="flex flex-wrap gap-1">
              {match.matchingLearn.map((s) => (
                <SkillTag key={s} skill={s} variant="learn" />
              ))}
            </div>
          </div>
        )}

        {connStatus === "none" && (
          <Button size="sm" className="w-full gap-2" onClick={handleConnect} disabled={sendConnection.isPending}>
            <UserPlus className="h-4 w-4" /> Connect
          </Button>
        )}
        {connStatus === "sent" && (
          <Button size="sm" variant="secondary" className="w-full" disabled>
            Request Sent
          </Button>
        )}
        {connStatus === "received" && (
          <Badge className="w-full justify-center py-1.5">Request Received</Badge>
        )}
        {connStatus === "connected" && (
          <Button size="sm" variant="outline" className="w-full" asChild>
            <Link to="/chat">Connected — Chat Now</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: allProfiles } = useAllProfiles();

  const matches = useMemo(() => {
    if (!profile || !allProfiles) return [];
    return computeMatches(profile, allProfiles);
  }, [profile, allProfiles]);

  const hasSkills = profile && ((profile.skills_teach?.length || 0) > 0 || (profile.skills_learn?.length || 0) > 0);

  if (profileLoading) {
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Welcome */}
        <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-accent/10 p-6">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Student"}! 👋
          </h1>
          <p className="mt-1 text-muted-foreground">Find your perfect skill exchange partner</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile?.skills_teach?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Skills Teaching</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-accent p-2">
                <Sparkles className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profile?.skills_learn?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Skills Learning</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{matches.length}</p>
                <p className="text-xs text-muted-foreground">Matches Found</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Setup prompt */}
        {!hasSkills && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 text-center">
              <Sparkles className="mx-auto mb-2 h-8 w-8 text-primary" />
              <h3 className="mb-1 font-semibold">Set Up Your Skills</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Add skills you can teach and want to learn to start getting matches!
              </p>
              <Button asChild>
                <Link to="/profile">Go to Profile</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Matches */}
        {matches.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-foreground">Your Skill Matches</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((m) => (
                <MatchCard key={m.profile.id} match={m} />
              ))}
            </div>
          </div>
        )}

        {hasSkills && matches.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No matches yet. More students are joining!</p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </Layout>
  );
}
