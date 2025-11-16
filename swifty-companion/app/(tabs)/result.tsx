// app/tabs/result.tsx
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { getUserByLogin } from "../../services/ftApi";

export function findCursusBySlug(user: any, slug: string) {
    if (!user || !Array.isArray(user.cursus_users)) return null;

    return (
        user.cursus_users.find(
            (cu: any) => cu.cursus && cu.cursus.slug === slug
        ) || null
    );
}

// helper spécifique 42cursus
export function get42Cursus(user: any) {
    return findCursusBySlug(user, "42cursus");
}

export default function ResultScreen() {
    const { login } = useLocalSearchParams<{ login: string }>();
    const router = useRouter();
    const navigation = useNavigation();

    useLayoutEffect(() => {
        if (login) {
            navigation.setOptions({ title: String(login) });
        }
    }, [navigation, login]);

    const [user, setUser] = useState<any>(null);
    const [cursus, setCursus] = useState<any>(null);
    const [finishedProjects, setFinishedProjects] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!login) return;

        const run = async () => {
            try {
                setLoading(true);

                const data = await getUserByLogin(String(login));
                setUser(data);

                const c42 = get42Cursus(data);
                setCursus(c42);

                const cursusId = c42?.cursus_id;

                const fp =
                    data.projects_users?.filter((pu: any) => {
                        // on veut uniquement les projets "finished" DU cursus 42cursus
                        const inThisCursus =
                            Array.isArray(pu.cursus_ids) &&
                            cursusId !== undefined &&
                            pu.cursus_ids.includes(cursusId);

                        return pu.status === "finished" && inThisCursus;
                    }) || [];
                setFinishedProjects(fp);

                setLoading(false);
            } catch (e: any) {
                console.log(e);
                setError(e?.message || "Erreur lors du chargement du profil.");
                setLoading(false);
            }
        };

        run();
    }, [login]);

    if (!login) {
        return (
            <View style={styles.container}>
                <Text style={styles.error}>Aucun login fourni.</Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator />
                <Text style={styles.text}>Chargement du profil {login}...</Text>
            </View>
        );
    }

    if (error || !user) {
        return (
            <View style={styles.container}>
                <Text style={styles.error}>{error || "Profil introuvable."}</Text>
                <Text style={styles.link} onPress={() => router.back()}>
                    ← Retour
                </Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <ImageBackground
                source={require("../../assets/images/bg.png")}
                resizeMode="cover"
            >
                <View style={styles.image_bg}>
                    <Image source={{ uri: user.image?.link }} style={styles.avatar} />
                    <Text style={styles.title}>{user.displayname || "N/A"}</Text>

                    <Text style={styles.login}>{user.login}</Text>
                    <Text style={styles.text}>Email : {user.email || "N/A"}</Text>
                    <Text style={styles.text}>Phone : {user.phone || "N/A"}</Text>
                    <Text style={styles.text}>
                        Points de Correction : {user.correction_point || "N/A"}
                    </Text>
                    <Text style={styles.text}>Wallet : {user.wallet} </Text>
                    {cursus && (
                        <Text style={styles.text}>Level : {cursus.level}</Text>
                    )}
                </View>
            </ImageBackground>

            {/* SKILLS 42CURSUS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skills (42cursus)</Text>

                {!cursus && (
                    <Text style={styles.text}>Aucun cursus 42cursus trouvé.</Text>
                )}

                {cursus &&
                    cursus.skills &&
                    cursus.skills.map((skill: any) => {
                        const percent = Math.min(
                            100,
                            Math.round((skill.level / 21) * 100)
                        );

                        return (
                            <View key={skill.id} style={styles.skillRow}>
                                <View style={styles.skillHeader}>
                                    <Text style={styles.skillName}>{skill.name}</Text>
                                    <Text style={styles.skillValue}>
                                        {skill.level.toFixed(2)} ({percent}%)
                                    </Text>
                                </View>

                                <View style={styles.skillBarBg}>
                                    <View
                                        style={[
                                            styles.skillBarFill,
                                            { width: `${percent}%` },
                                        ]}
                                    />
                                </View>
                            </View>
                        );
                    })}
            </View>

            {/* PROJETS FINIS (VALIDÉS + RATÉS) */}
            {finishedProjects.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Projects (finished, success & failed)
                    </Text>

                    {finishedProjects.map((pu: any) => {
                        const isSuccess = pu["validated?"] === true;

                        return (
                            <View key={pu.id} style={styles.projectRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.projectName}>{pu.project?.name}</Text>
                                    <Text style={styles.projectSlug}>{pu.project?.slug}</Text>
                                </View>

                                <Text
                                    style={[
                                        styles.projectStatus,
                                        isSuccess ? styles.projectSuccess : styles.projectFail,
                                    ]}
                                >
                                    {isSuccess ? "Validated" : "Failed"}
                                </Text>

                                <Text style={styles.projectMark}>
                                    {pu.final_mark !== null ? pu.final_mark : "-"}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#020617",
    },
    image_bg: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#e5e7eb",
        marginBottom: 0,
    },
    login: {
        fontSize: 15,
        color: "#e5e7eb",
        marginBottom: 20,
    },
    text: {
        color: "#d1d5db",
        marginBottom: 8,
    },
    error: {
        color: "#fca5a5",
        fontSize: 16,
        marginBottom: 12,
    },
    link: {
        color: "#22c55e",
        marginTop: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: "#ccc",
    },
    section: {
        width: "100%",
        marginTop: 24,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#e5e7eb",
        marginBottom: 12,
    },
    skillRow: {
        marginBottom: 10,
    },
    skillHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    skillName: {
        color: "#e5e7eb",
        fontSize: 14,
        fontWeight: "500",
    },
    skillValue: {
        color: "#9ca3af",
        fontSize: 13,
    },
    skillBarBg: {
        height: 8,
        borderRadius: 4,
        backgroundColor: "#1f2937",
        overflow: "hidden",
    },
    skillBarFill: {
        height: "100%",
        backgroundColor: "#22c55e",
    },
    projectRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: "#1f2937",
    },
    projectName: {
        color: "#e5e7eb",
        fontWeight: "600",
    },
    projectSlug: {
        color: "#6b7280",
        fontSize: 12,
    },
    projectStatus: {
        marginHorizontal: 8,
        fontSize: 12,
        fontWeight: "700",
    },
    projectSuccess: {
        color: "#22c55e",
    },
    projectFail: {
        color: "#f97373",
    },
    projectMark: {
        color: "#e5e7eb",
        width: 40,
        textAlign: "right",
        fontWeight: "600",
    },
});
