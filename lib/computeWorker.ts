import { MinimalComplement } from "./MinimalComplement";

function computeCrewSuccessmissionSuccess(missionSuccess: any): MinimalComplement {
    let baseline = 0;
    let allConsideredCrew = new Set<number>();
    missionSuccess.forEach((entry: any) => {
        entry.crew.forEach((crew: any) => {
            allConsideredCrew.add(crew.crew.id);
        });

        baseline += (entry.crew.length > 0) ? entry.crew[0].success : 0;
    });

    // TODO: This should actually do a combinatorial (all possible combinations of crew ids from allConsideredCrew).
    // However, that pegs the CPU for minutes even on a fast i7-7700k
    // The algorithm below is suboptimal but it's much cheaper to run

    // Calculate minimal set of crew out of allConsideredCrew that still yields the same result for all challenges
    let removedCrew = new Set<number>();

    let before;
    do {
        before = allConsideredCrew.size;

        for (let crewId of Array.from(allConsideredCrew)) {
            let result = 0;

            missionSuccess.forEach((entry: any) => {
                let filteredCrew = entry.crew.filter((crew: any) => (crew.crew.id != crewId) && !removedCrew.has(crew.crew.id));
                result += (filteredCrew.length > 0) ? filteredCrew[0].success : 0;
            });

            if (result == baseline) {
                allConsideredCrew.delete(crewId);
                removedCrew.add(crewId);
                break;
            }
        }
    } while (allConsideredCrew.size < before);

    return {
        unneededCrew: Array.from(removedCrew),
        neededCrew: Array.from(allConsideredCrew)
    };
}

self.addEventListener('message', (message: any) => {
    (self as any).postMessage(computeCrewSuccessmissionSuccess(message.data.success));
});