// pi/durable-models.ts — the model mirror (T-030, D5).
//
// pi-durable generations speak to a pi-ai `Models`. This adapter delegates to
// pi's own live ModelRegistry (auth, provider catalogue, streaming) instead of
// copying configuration, so a provider registered in pi — custom baseUrl
// included — streams through unchanged.
//
// The call surface pi-durable actually uses (verified against its dist):
// getModel, streamSimple, completeSimple, fetchDeferred, cancelDeferred,
// classify, generateImages. Auth/login and the deferred family are not on that
// surface: they throw with a reason rather than pretending.

import type {
	Api,
	AssistantImages,
	AssistantMessage,
	AssistantMessageEventStream,
	ClassifierApi,
	ClassifierContext,
	ClassifierModel,
	ClassifierResult,
	Context,
	DeferredHandle,
	ImageApi,
	ImageModel,
	ImagesContext,
	Model,
	Models,
	ModelsClassifierOptions,
	ModelsDeferredCancelOptions,
	ModelsDeferredFetchOptions,
	ModelsImagesOptions,
	ModelsSimpleStreamOptions,
} from "@earendil-works/pi-ai";
import type { ModelRegistry } from "@earendil-works/pi-coding-agent";

const NOT_ON_THE_BRIDGE = (what: string) =>
	`pi-dev durable bridge: ${what} is not available through the pi model registry bridge.`;

// pi's extension loader (jiti 2.6.1/babel) cannot parse a generic-keyed
// indexed type such as ModelTypeMap[TType] in a type position (ParseError
// "Unexpected token, expected ]", minimal-repro'd 2026-10-21). The class
// below keeps every signature parser-boring through this concrete union and
// casts at the boundary, where the export below restores the exact Models
// interface for typechecking.
type AnyModelKind = ModelTypeMap[ModelType];

class RegistryModelsBase {
	constructor(private readonly registry: ModelRegistry) {}

	getModel(provider: string, id: string): Model<Api> | undefined {
		return this.registry.find(provider, id);
	}

	streamSimple(model: Model<Api>, context: Context, options?: ModelsSimpleStreamOptions): AssistantMessageEventStream {
		return this.registry.streamSimple(model, context, options);
	}

	completeSimple(model: Model<Api>, context: Context, options?: ModelsSimpleStreamOptions): Promise<AssistantMessage> {
		// pi-ai's own completeSimple is streamSimple(...).result(); same here.
		return this.registry.streamSimple(model, context, options).result();
	}

	streamDeferred(model: Model<Api>, _handle: DeferredHandle, _options?: ModelsDeferredFetchOptions): AssistantMessageEventStream {
		throw new Error(NOT_ON_THE_BRIDGE("deferred-response streaming"));
	}

	fetchDeferred(_model: Model<Api>, _handle: DeferredHandle, _options?: ModelsDeferredFetchOptions): Promise<AssistantMessage> {
		// Reached only when a provider emits a deferred handle mid-stream; the
		// registry's providers do not, so this stays a hard, honest error.
		throw new Error(NOT_ON_THE_BRIDGE("deferred-response polling"));
	}

	cancelDeferred(_model: Model<Api>, _handle: DeferredHandle, _options?: ModelsDeferredCancelOptions): Promise<void> {
		throw new Error(NOT_ON_THE_BRIDGE("deferred-response cancellation"));
	}

	generateImages(model: ImageModel<ImageApi>, context: ImagesContext, options?: ModelsImagesOptions): Promise<AssistantImages> {
		return this.registry.generateImages(model, context, options);
	}

	classify(model: ClassifierModel<ClassifierApi>, context: ClassifierContext, options?: ModelsClassifierOptions): Promise<ClassifierResult> {
		return this.registry.classify(model, context, options);
	}
}

/**
 * RegistryModels: the class body stays parser-boring (jiti cannot parse
 * generic-keyed indexed types in type positions); the Proxy restores the exact
 * `Models` interface for typechecking — and speaks the honest error for any
 * method pi-durable has never called across its dist: a named refusal, not a
 * speculative pass-through that might carry the wrong semantics.
 */
export const RegistryModels: new (registry: ModelRegistry) => Models = new Proxy(RegistryModelsBase as unknown as new (
	registry: ModelRegistry,
) => Models, {
	construct(Target, args) {
		const instance = new (Target as new (registry: ModelRegistry) => object)(...args);
		return new Proxy(instance, {
			get(target, prop, receiver) {
				if (typeof prop !== "string" || prop in target) return Reflect.get(target, prop, receiver);
				return () => {
					throw new Error(NOT_ON_THE_BRIDGE(String(prop)));
				};
			},
		}) as unknown as Models;
	},
});
