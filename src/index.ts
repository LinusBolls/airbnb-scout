import * as Tone from "tone";
import { Midi, Track } from "@tonejs/midi";

const midiConverterHtml = `<div>
  <input type="file" id="filereader" />
  <div id="trackInfo">
    <input id="trackButton0" type="checkbox" value="0" /> Track 1: kalimba - 6
    notes<br />Speed multiplier:
    <input
      id="speedMultiplierInput"
      type="number"
      step="0.01"
      min="0.01"
      value="1"
    />
  </div>
  <button type="button" id="previewStart">
    Play/Pause Preview
  </button>
  <button type="button" id="previewStop">
    Stop Preview
  </button>
  <button data-octoplay="play">Play</button>
  <button data-octoplay="pauseUnpause">Pause/Unpause</button>
</div>
<div>
  <input type="checkbox" id="g4toggle" />
  <label for="g4toggle"> Add G4 after M300 (required for Duet)</label>
  <div id="runDuration">N/A</div>
</div>
<br />
<textarea id="outputArea" rows="50" cols="100"></textarea>`;

function getCsrfToken() {
  return document.cookie.replace("csrf_token_P80=", "");
}

async function play(str: string) {
  console.log("[gcode] executing:", str?.split("\n") ?? []);

  const res = await fetch("http://codeoctopi.local/api/printer/command", {
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      "content-type": "application/json; charset=UTF-8",
      "x-csrf-token": getCsrfToken(),
    },
    body: JSON.stringify({
      commands: str?.split("\n") ?? [],
      parameters: {},
    }),
    method: "POST",
  });
}

function mount() {
  const terminalSendpanel = document.querySelector(
    "#terminal-sendpanel"
  ) as HTMLDivElement;

  terminalSendpanel.insertAdjacentHTML(
    "afterend",
    `<div data-bind="visible: loginState.hasPermissionKo(access.permissions.CONTROL)" data-octoplay="textarea">
        <form class="input-block-level input-append">
            <textarea placeholder="G-code (seperate commands by pressing enter, submit using ctrl + enter)"></textarea>
        </form>
    </div>` + midiConverterHtml
  );
  terminalSendpanel.style.display = "none !important";

  const textarea = document.querySelector(
    '[data-octoplay="textarea"] textarea'
  ) as HTMLTextAreaElement;

  const form = document.querySelector('[data-octoplay="textarea"] form');

  if (!textarea) {
    console.error("Failed to mount textarea");
    return;
  }
  if (!form) {
    console.error("Failed to mount form");
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    play(textarea.value);

    textarea.value = "";
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      play(textarea.value);

      textarea.value = "";
    }
  });
}
mount();
mountExternalCode();

class GcodeCommand {
  private gcode: string;
  private chunks: string[][];
  private chunkMaxDurationMs: number | null;
  private chunkBleedMs: number;
  private currentChunkIndex: number;
  private currentChunkStartedAt: number | null;
  private lastPlayedChunkIndex: number;
  public state: "PAUSED" | "PLAYING" | "FINISHED";

  constructor(gcode: string, chunkMaxDurationMs: number | null = 1000) {
    this.gcode = gcode;
    this.chunks =
      chunkMaxDurationMs == null
        ? [[gcode]]
        : gcodeToChunks(gcode, chunkMaxDurationMs);
    this.chunkMaxDurationMs = chunkMaxDurationMs;
    this.chunkBleedMs = 200;

    this.currentChunkIndex = 0;
    this.currentChunkStartedAt = null;
    this.lastPlayedChunkIndex = -1;

    this.state = "PAUSED";
  }

  playChunk(chunkIndex: number) {
    if (chunkIndex >= this.chunks.length) {
      this.state = "FINISHED";
      return;
    }

    const chunk = this.chunks[chunkIndex];
    if (!chunk) return;

    play(chunk.join("\n")); // Send chunk for execution

    this.currentChunkIndex = chunkIndex;
    this.lastPlayedChunkIndex = chunkIndex; // ✅ Update last played chunk index
    this.currentChunkStartedAt = Date.now();
  }

  goToBeginning() {
    this.currentChunkIndex = 0;
    this.lastPlayedChunkIndex = -1; // Reset tracking
  }

  pause() {
    this.state = "PAUSED";
  }

  unpause() {
    this.state = "PLAYING";
    if (this.lastPlayedChunkIndex === -1) {
      this.playChunk(0); // Start from the first chunk
    }
  }

  shouldStartPlayingNextChunk() {
    if (this.state !== "PLAYING" || this.currentChunkStartedAt == null)
      return false;

    if (this.lastPlayedChunkIndex >= this.chunks.length - 1) return false;

    const elapsedTime = Date.now() - this.currentChunkStartedAt;
    const currentChunkDuration = getGcodeRunDurationMs(
      this.chunks[this.lastPlayedChunkIndex].join("\n")
    );

    return elapsedTime >= currentChunkDuration + this.chunkBleedMs;
  }

  tick() {
    if (this.shouldStartPlayingNextChunk()) {
      this.playChunk(this.lastPlayedChunkIndex + 1);
    }
  }
}

function getGcodeRunDurationMs(input: string) {
  const regex = /\sP(\d+)/g;
  let sum = 0;
  let match;

  while ((match = regex.exec(input)) !== null) {
    sum += parseInt(match[1], 10);
  }
  return sum;
}

function gcodeToChunks(gcode: string, chunkMaxDurationMs = 1000): string[][] {
  const commands = gcode.split("\n").filter((i) => i.trim() !== "");
  const chunks: string[][] = [];

  let chunk: string[] = [];
  let chunkDuration = 0;

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    const duration = getGcodeRunDurationMs(command);

    if (chunkDuration + duration > chunkMaxDurationMs) {
      chunks.push(chunk);
      chunk = [];
      chunkDuration = 0;
    }
    chunk.push(command);
    chunkDuration += duration;
  }
  if (chunk.length > 0) {
    chunks.push(chunk);
  }
  return chunks;
}

function mountExternalCode() {
  function getGcodeRunDurationMs(input: string) {
    const regex = /\sP(\d+)/g;
    let sum = 0;
    let match;

    while ((match = regex.exec(input)) !== null) {
      sum += parseInt(match[1], 10);
    }

    return sum;
  }

  let midi: Midi | null = null;

  (document.querySelector("#outputArea") as HTMLInputElement).value = "";

  let synth = new Tone.Synth({
    oscillator: {
      type: "square",
    },
    envelope: {
      attack: 0,
      decay: 0,
      sustain: 1,
      release: 0.001,
    },
  }).toMaster();

  synth.volume.value = -25;

  document.querySelector("#filereader")!.addEventListener("change", (e) => {
    const files = (e.target as HTMLInputElement).files;

    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = function (e) {
        const result = e.target?.result;

        if (!result || !(result instanceof ArrayBuffer)) {
          alert("Invalid file provided.");
          return;
        }

        midi = new Midi(result);

        if (!midi) {
          alert("Invalid file provided.");
          return;
        }
        generateTrackInfo(midi);
      };
      reader.readAsArrayBuffer(file);

      reader.addEventListener("loadend", () => {
        handleMidi();
      });
    }
  });

  function playNote(frequency: number, duration: number) {
    // Simulate a startup time of 5ms
    return (time: number) => {
      synth.triggerAttackRelease(frequency, duration - 5 / 1000, time);
    };
  }

  function togglePreview() {
    Tone.getTransport().toggle();
  }

  function stopPreview() {
    Tone.getTransport().stop();
  }

  function generateTrackInfo(midi: Midi) {
    let infoDiv = document.querySelector("#trackInfo")!;
    infoDiv.innerHTML = "";
    const trackSelectors = midi.tracks.forEach((track, index) => {
      infoDiv.innerHTML += `<input id="trackButton${index}" type="checkbox" value=${index}> Track ${
        index + 1
      }: ${track.instrument.name} - ${track.notes.length} notes<br>`;
    });
    infoDiv.innerHTML +=
      'Speed multiplier: <input id="speedMultiplierInput" type="number" step="0.01" min="0.01" value="1">';

    document
      .querySelector("#speedMultiplierInput")!
      .addEventListener("change", handleMidi);

    (document.querySelector("#trackButton0") as HTMLInputElement).checked =
      true;
  }

  // From https://gist.github.com/YuxiUx/ef84328d95b10d0fcbf537de77b936cd
  function noteToFreq(note: number) {
    let a = 440; //frequency of A (common value is 440Hz)
    return (a / 32) * 2 ** ((note - 9) / 12);
  }

  function handleMidi() {
    const useG4 = (document.querySelector("#g4toggle") as HTMLInputElement)
      .checked;

    // Clear previous scheduled tones
    Tone.getTransport().stop();
    Tone.getTransport().cancel();

    if (!midi) {
      alert("No MIDI provided.");
      return;
    }

    const track: {
      notes: (Track["notes"] & any)[];
    } = {
      notes: [],
    };

    // Merge note arrays from selected tracks
    for (let i = 0; i < midi.tracks.length; i++) {
      if (
        (document.querySelector(`#trackButton${i}`) as HTMLInputElement).checked
      ) {
        let currTrack = midi.tracks[i].notes;
        // If percussion, add a percussion flag to note
        if (midi.tracks[i].instrument.percussion) {
          currTrack.forEach((note) => {
            // @ts-expect-error todo: fix this
            note.percussion = true;
          });
        }
        track.notes = track.notes.concat(currTrack as Track["notes"] & any[]);
      }
    }

    // Sort notes by start time
    track.notes.sort((a, b) => a.time - b.time);

    const tempoMultiplier =
      1 /
      Math.max(
        parseFloat(
          (document.querySelector("#speedMultiplierInput") as HTMLInputElement)
            .value
        ),
        0.01
      );

    let curr = 0;
    const gcode = [];
    while (curr < track.notes.length) {
      // Keep the highest non-percussion note if multiple occur at the same time
      let highestCurrNote = track.notes[curr].percussion
        ? -1
        : track.notes[curr].midi;
      let duration = track.notes[curr].duration;
      while (
        curr + 1 < track.notes.length &&
        track.notes[curr].time === track.notes[curr + 1].time
      ) {
        curr++;
        if (
          track.notes[curr].midi > highestCurrNote &&
          !track.notes[curr].percussion
        ) {
          duration = track.notes[curr].duration;
        }

        highestCurrNote = track.notes[curr].percussion
          ? highestCurrNote
          : Math.max(highestCurrNote, track.notes[curr].midi);
      }

      // Default to 20ms, 100hz note to simulate percussion
      const frequency =
        highestCurrNote === -1 ? 100 : noteToFreq(highestCurrNote);
      duration = highestCurrNote === -1 ? 20 / 1000 : duration;

      const time = track.notes[curr].time;
      const nextNoteTime =
        curr + 1 < track.notes.length
          ? track.notes[curr + 1].time
          : duration + time;

      // If this note overlaps the next note, cut the current note off
      let trimmedDuration = Math.min(nextNoteTime - time, duration);

      const pauseDuration = nextNoteTime - time - trimmedDuration;

      // Marlin doesn't seem to deal with very short pauses accurately, so merge short pauses with the previous note.
      // May need tuning
      const minDuration = 20 / 1000;

      if (pauseDuration < minDuration) {
        trimmedDuration += pauseDuration;
      }
      // Write an M300 to play a note with the calculated pitch and duration
      gcode.push(
        `M300 P${Math.round(
          trimmedDuration * 1000 * tempoMultiplier
        )} S${Math.round(frequency)}\n`
      );

      // Duet firmware needs G4 pauses between notes
      if (useG4) {
        gcode.push(
          `G4 P${Math.round(trimmedDuration * 1000 * tempoMultiplier)}\n`
        );
      }

      // Schedule note to be played in song preview
      Tone.getTransport().schedule(
        playNote(frequency, trimmedDuration * tempoMultiplier),
        time * tempoMultiplier
      );

      // If the current note is released before the start of the next note, insert a pause
      if (pauseDuration >= minDuration) {
        gcode.push(
          `M300 P${Math.round(pauseDuration * tempoMultiplier * 1000)} S0\n`
        );
        if (useG4) {
          gcode.push(
            `G4 P${Math.round(pauseDuration * tempoMultiplier * 1000)}\n`
          );
        }
      }

      curr++;
    }

    const output = gcode.reduce((acc, e) => acc + e, "");
    (document.querySelector("#outputArea") as HTMLInputElement).value = output;

    const runDurationMs = getGcodeRunDurationMs(output);

    document.querySelector("#runDuration")!.innerHTML =
      "duration: " + runDurationMs + "ms";
  }

  let command: GcodeCommand | null = null;

  document
    .querySelector("#previewStart")!
    .addEventListener("click", togglePreview);
  document
    .querySelector("#previewStop")!
    .addEventListener("click", stopPreview);
  document
    .querySelector('[data-octoplay="play"]')!
    .addEventListener("click", () => {
      const gcode = (document.querySelector("#outputArea") as HTMLInputElement)
        .value;

      command = new GcodeCommand(gcode, null);

      command.unpause();

      setInterval(() => command!.tick(), 100);
    });

  document
    .querySelector('[data-octoplay="pauseUnpause"]')!
    .addEventListener("click", () => {
      if (command) {
        if (command.state === "PAUSED") {
          command.unpause();
        } else {
          command.pause();
        }
      }
    });

  document.querySelector("#g4toggle")!.addEventListener("change", handleMidi);
  document
    .querySelector("#speedMultiplierInput")!
    .addEventListener("change", handleMidi);
}
